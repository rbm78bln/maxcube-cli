maxcube-cli
=======

eQ-3 Max! Cube command line interface

Updated to use [maxcube2](https://github.com/normen/maxcube2) interface now.
Batchmode added for executing commands right from the command line.
Setting temperature or mode automatically returns the new status as json.
Commands delay and nop do so as well B-)


## Start
```
node maxcube-cli.js <ip> [[<port>] command]
```

## Node RED
maxcube-cli-wrapper was created to exec maxcube-cli from inside Node RED. It doesn't actually do much more tahn just stripping away some control characters that vorpal emits even when running in a dumb terminal.
This way you can create your maxcube-cli command line inside Node RED from your dashboard controls, execute maxcube-cli which then connects to your MAX! Cube, executes the actions that you defined, retrieves the current status and prints it to stdout as JSON, disconnects from the cube, and you can simply parse the output and update your dashboard controls.
Like this your connection to the MAX! Cube will only be busy for a very short period of time and you can still use the app as usual.

## Commands
    exit                                               Exits application
    status [rf_address]                                Get status of all or specified devices.
                                                       Options: -v (--verbose) for verbose output; -p (--plain) for plain output (no table)
    comm                                               Get comm status
    temp <rf_address> <degrees>                        Sets setpoint temperature of specified device
    mode <rf_address> <mode> [until]                   Sets mode (AUTO, MANUAL, BOOST or VACATION) of specified device.
                                                       Mode VACATION needs until date/time (ISO 8601, e.g. 2019-06-20T10:00:00Z)
    tempandmode <rf_address> <degrees> <mode> [until]  Sets setpoint temperature and mode (AUTO, MANUAL, BOOST or VACATION) of specified device.
                                                       Mode VACATION needs until date/time (ISO 8601, e.g. 2019-06-20T10:00:00Z)
    delay <millis>                                     Delay of <millis> ms (for batch mode)
    nop                                                No operation (for batch mode)
