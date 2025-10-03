import traceback
try:
    import web_automator
    print('Imported automation.web_automator OK')
except Exception as e:
    traceback.print_exc()
    print('ERROR:', e)
