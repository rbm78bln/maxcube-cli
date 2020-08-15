var batchTimeout = 2500;

var MaxCube = require('maxcube2');
var vorpal = require('vorpal')();
var Table = require('cli-table2');

var ip = process.argv[2];
var port = process.argv[3] || 62910;

var batchMode = false;
var currentTimeout = 0;

if (!ip) {
  console.error('Usage: maxcube-cli hostname [port [command]]');
  return;
}

var commands = [];

if (process.argv.length > 4) {
  process.argv.shift();
  process.argv.shift();
  process.argv.shift();
  process.argv.shift();

  if (
    process.argv[0] == 'temp' ||
    process.argv[0] == 'mode' ||
    process.argv[0] == 'tempandmode'
  ) {
    commands.push('status --quiet');
  }

  commands.push(process.argv.join(' '));

  if (
    process.argv[0] == 'temp' ||
    process.argv[0] == 'mode' ||
    process.argv[0] == 'tempandmode'
  ) {
    commands.push('delay 2500');
  }

  if (
    process.argv[0] != 'status' &&
    process.argv[0] != 'comm' &&
    process.argv[0] != 'help'
  ) {
    commands.push('status --verbose --plain');
  }
  commands.push('exit');
}
batchMode = (commands.length) > 0;

var maxCube = new MaxCube(ip, port);

function timer() {
  if (currentTimeout > 0) {
    currentTimeout -= 500;
    if (currentTimeout > 0) {
      setTimeout(timer, 500);
    } else {
      currentTimeout = 0;
      if (!batchMode) vorpal.log("Timeout!");
      vorpal.exec('exit');
      maxCube.close();
      process.exit(1);
    }
  }
}

async function execCommands() {
  if (commands.length < 1) return;
  currentTimeout = batchTimeout;
  setTimeout(timer, 500);

  var result;
  while (commands.length > 0) {
    currentTimeout = batchTimeout;
    let command = commands.shift();
    let promise = new Promise((resolve, reject) => {
      vorpal.exec(
        command,
        (result) => {
          resolve(result)
        }
      )
    });
    result = await promise;
  }
}

maxCube.on('connected', function () {
  if (!batchMode) vorpal.log('Connection established.');
  if (commands.length) execCommands();
});

maxCube.on('closed', function () {
  if (!batchMode) vorpal.log('Connection closed.');
  currentTimeout = 1000;
  vorpal.exec('exit');
});

maxCube.on('error', function () {
  if (!batchMode) vorpal.log('An error occured.');
  currentTimeout = 1000;
  vorpal.exec('exit');
});

vorpal
  .command('status [rf_address]', 'Get status of all or specified devices')
  .alias('s')
  .option('-p, --plain', 'Plain json output, no table')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'No output')
  .action(function (args, callback) {
    var self = this;
    if (args.options.quiet) {
      args.options.verbose = false;
      args.options.plain = false;
    }
    maxCube.getDeviceStatus(args.rf_address).then(function (devices) {
      if (args.options.verbose) {
        if (args.options.plain) {
          self.log( JSON.stringify(devices, null, 2) );
        } else {
          var table = new Table({
            head: ['RF address', 'name', 'room', 'mode', 'setpoint', 'valve', 'temp', 'battery_low', 'initialized', 'fromCmd', 'error', 'valid', 'dst_active', 'gateway_known', 'panel_locked', 'link_error'],
            colWidths: [10, 20]
          });
          devices.forEach(function (device) {
            var deviceInfo = maxCube.getDeviceInfo(device.rf_address);
            table.push([
              device.rf_address,
              deviceInfo.device_name,
              deviceInfo.room_name,
              device.mode,
              device.setpoint,
              device.valve,
              device.temp,
              device.battery_low,
              device.initialized,
              device.fromCmd,
              device.error,
              device.valid,
              device.dst_active,
              device.gateway_known,
              device.panel_locked,
              device.link_error
            ]);
          });
          self.log(table.toString());
        }
      } else {
        if (args.options.plain) {
          devices.forEach(function (device) {
            var deviceInfo = maxCube.getDeviceInfo(device.rf_address);
            self.log(device.rf_address + ' (' + deviceInfo.device_name + ', ' + deviceInfo.room_name + ')');
            self.log('    temp: ' + device.temp + ', ' +
              'setpoint: ' + device.setpoint + ', ' +
              'valve: ' + device.valve + ', ' +
              'mode: ' + device.mode
            );
          });
        } else {
          var table = new Table({
            head: ['RF address', 'name', 'room', 'mode', 'setpoint', 'valve', 'temp'],
            colWidths: [10, 20]
          });
          devices.forEach(function (device) {
            var deviceInfo = maxCube.getDeviceInfo(device.rf_address);
            table.push([
              device.rf_address,
              deviceInfo.device_name,
              deviceInfo.room_name,
              device.mode,
              device.setpoint,
              device.valve,
              device.temp
            ]);
          });
          if (!args.options.quiet) self.log(table.toString());
        }
      }
      callback();
    });
  });

vorpal
  .command('flush', 'Flush device/room cache')
  .action(function (args, callback) {
    var self = this;
    maxCube.flushDeviceCache().then(function (success) {
      self.log('Device/room cache cleared');
      callback();
    });
  });

vorpal
  .command('comm', 'Get comm status')
  .action(function (args, callback) {
    this.log(maxCube.getCommStatus());
    callback();
  });

vorpal
  .command('temp <rf_address> <degrees>', 'Sets setpoint temperature of specified device')
  .autocomplete({
    data: function () {
      return Object.keys(maxCube.getDevices());
    }
  })
  .action(function (args, callback) {
    var self = this;
    maxCube.setTemperature(args.rf_address, args.degrees).then(function (success) {
      if (success) {
        if (!batchMode) self.log('Temperature set');
      } else {
        if (!batchMode) self.log('Error setting temperature');
      }
      callback();
    });
  });

vorpal
  .command('mode <rf_address> <mode> [until]', 'Sets mode (AUTO, MANUAL, BOOST or VACATION) of specified device.\nMode VACATION needs until date/time (ISO 8601, e.g. 2019-06-20T10:00:00Z)')
  .autocomplete({
    data: function () {
      return Object.keys(maxCube.getDevices()).concat(['AUTO', 'MANUAL', 'BOOST', 'VACATION']);
    }
  })
  .validate(function (args) {
    if (args.mode === 'VACATION' && !args.until) {
      return 'Error: until date needed for mode VACATION';
    } else {
      return true;
    }
  })
  .action(function (args, callback) {
    var self = this;
    maxCube.setTemperature(args.rf_address, null, args.mode, args.date_until).then(function (success) {
      if (success) {
        if (!batchMode) self.log('Mode set');
      } else {
        if (!batchMode) self.log('Error setting mode');
      }
      callback();
    });
  });

vorpal
  .command('tempandmode <rf_address> <degrees> <mode> [until]', 'Sets setpoint temperature and mode (AUTO, MANUAL, BOOST or VACATION) of specified device.\nMode VACATION needs until date/time (ISO 8601, e.g. 2019-06-20T10:00:00Z)')
  .autocomplete({
    data: function () {
      return Object.keys(maxCube.getDevices()).concat(['AUTO', 'MANUAL', 'BOOST', 'VACATION']);
    }
  })
  .validate(function (args) {
    if (args.mode === 'VACATION' && !args.until) {
      return 'Error: until date needed for mode VACATION';
    } else {
      return true;
    }
  })
  .action(function (args, callback) {
    var self = this;
    maxCube.setTemperature(args.rf_address, args.degrees, args.mode, args.date_until).then(function (success) {
      if (success) {
        if (!batchMode) self.log('Temperature and mode set');
      } else {
        if (!batchMode) self.log('Error setting temperature and mode');
      }
      callback();
    });
  });

vorpal
  .command('delay <millis>', 'Delay of <millis> ms (for batch mode)')
  .action(function (args, callback) {
    var self = this;
    if (batchMode) currentTimeout = (args.millis + 10);
    if (!batchMode) self.log('Waiting ' + args.millis + ' ms...');
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), args.millis)
    });
  });

vorpal
  .command('nop', 'No operation (for batch mode)')
  .action(function (args, callback) {
    callback();
  });

vorpal
  .find('exit')
  .alias('x')
  .action(function (args, callback) {
    currentTimeout = 0;
    maxCube.close();
  });


if (batchMode) {
  vorpal.delimiter('');
} else {
  vorpal.history('maxcube-cli');
  vorpal.delimiter('maxcube> ');
}

vorpal.show();
