use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

fn dispatch_audio_monitor_toggle(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.eval("window.dispatchEvent(new CustomEvent('mutejar:toggle-audio-monitor'));");
    }
}

#[tauri::command]
fn set_tray_monitor_state(app: tauri::AppHandle, active: bool) {
    if let Some(tray) = app.tray_by_id("mutejar-tray") {
        let tooltip = if active {
            "Mute Jar — Audio Monitor Live (Click to Pause)"
        } else {
            "Mute Jar — Audio Monitor Paused (Click to Start)"
        };
        let _ = tray.set_tooltip(Some(tooltip));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_tray_monitor_state])
        .setup(|app| {
            let toggle_item =
                MenuItemBuilder::with_id("toggle_monitor", "Toggle Audio Monitor").build(app)?;
            let show_item = MenuItemBuilder::with_id("show", "Open Mute Jar").build(app)?;
            let hide_item = MenuItemBuilder::with_id("hide", "Hide to Status Bar").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit Mute Jar").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&toggle_item)
                .separator()
                .item(&show_item)
                .item(&hide_item)
                .separator()
                .item(&quit_item)
                .build()?;

            let mut tray_builder = TrayIconBuilder::with_id("mutejar-tray")
                .tooltip("Mute Jar — Audio Monitor Paused (Click to Start)")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .icon_as_template(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        dispatch_audio_monitor_toggle(tray.app_handle());
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle_monitor" => {
                        dispatch_audio_monitor_toggle(app);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                });

            if let Some(icon) = app.default_window_icon().cloned() {
                tray_builder = tray_builder.icon(icon);
            }

            tray_builder.build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Mute Jar desktop application");
}
