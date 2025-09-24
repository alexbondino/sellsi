modules = [
    'components.consola_widget',
    'components.botones',
    'components.mensajes',
    'components.tooltip',
    'automation.web_automator',
    'automation.shared.login_handler',
    'automation.MtM.browser_manager',
    'automation.MtM.navigation_handler',
    'automation.MtM.ui_controller',
    'automation.MtM.downloader',
    'automation.MtM.element_finder'
]


def main():
    import importlib

    results = {}
    for m in modules:
        try:
            importlib.import_module(m)
            results[m] = 'OK'
        except Exception as e:
            results[m] = f'ERROR: {type(e).__name__}: {e}'

    for m, r in results.items():
        print(f"{m}: {r}")


if __name__ == '__main__':
    main()
