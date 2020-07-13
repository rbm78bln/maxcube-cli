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
