use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::Wry;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Serialize, Deserialize)]
struct AuthResult {
    success: bool,
    message: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn authenticate_user(reason: String) -> Result<AuthResult, String> {
    #[cfg(target_os = "macos")]
    {
        macos_biometric_auth(&reason).await
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Biometric authentication is only supported on macOS".to_string())
    }
}

#[cfg(target_os = "macos")]
async fn macos_biometric_auth(reason: &str) -> Result<AuthResult, String> {
    use cocoa::base::{id, nil};
    use cocoa::foundation::{NSAutoreleasePool, NSString};
    use objc::runtime::{Class, Object};
    use objc::{msg_send, sel, sel_impl};
    use std::sync::mpsc;
    use std::thread;

    let (tx, rx) = mpsc::channel();
    let reason_owned = reason.to_string();

    thread::spawn(move || {
        unsafe {
            let _pool = NSAutoreleasePool::new(nil);

            // Get LAContext class
            let la_context_class = Class::get("LAContext").expect("LAContext class not found");
            let context: id = msg_send![la_context_class, alloc];
            let context: id = msg_send![context, init];

            // Create NSString for the reason
            let reason_nsstring = NSString::alloc(nil).init_str(&reason_owned);

            // Create policy for device owner authentication
            let policy: i32 = 2; // LAPolicyDeviceOwnerAuthentication

            // Check if biometrics are available
            let mut error: id = nil;
            let can_evaluate: bool = msg_send![context, canEvaluatePolicy:policy error:&mut error];

            if !can_evaluate {
                let result = AuthResult {
                    success: false,
                    message: "Biometric authentication not available on this device".to_string(),
                };
                tx.send(result).unwrap();
                return;
            }

            // Evaluate policy
            let tx_clone = tx.clone();
            let block = block::ConcreteBlock::new(move |success: bool, error: id| {
                if success {
                    let result = AuthResult {
                        success: true,
                        message: "Authentication successful".to_string(),
                    };
                    tx_clone.send(result).unwrap();
                } else {
                    let error_msg = if error != nil {
                        let description: id = msg_send![error, localizedDescription];
                        let c_str: *const i8 = msg_send![description, UTF8String];
                        let rust_str = std::ffi::CStr::from_ptr(c_str)
                            .to_string_lossy()
                            .into_owned();
                        rust_str
                    } else {
                        "Authentication failed".to_string()
                    };

                    let result = AuthResult {
                        success: false,
                        message: error_msg,
                    };
                    tx_clone.send(result).unwrap();
                }
            });

            let block = block.copy();
            let _: () = msg_send![context, evaluatePolicy:policy 
                                 localizedReason:reason_nsstring 
                                 reply:block];
        }
    });

    // Wait for result
    rx.recv()
        .map_err(|e| format!("Failed to receive authentication result: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, authenticate_user])
        .setup(|app| {
            // Create a new store or load the existing one
            // this also put the store in the app's resource table
            // so your following `store` calls (from both Rust and JS)
            // will reuse the same store.

            let tagStore = app.store("tagStore.json")?;

            tagStore.close_resource();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
