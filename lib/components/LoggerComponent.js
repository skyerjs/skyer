'use strict';

const _       = require('lodash');
const moment  = require('moment');
const mkdirp  = require('mkdirp');
const winston = require('winston');

const AbstractComponent = require('../abstract/AbstractComponent');

class LoggerComponent extends AbstractComponent {
  constructor( name, options ) {
    super(name, options);

    this._skyerLogger = null;
  }

  _getConfig() {
    return this.skyer.config.get('skyer_logger');
  }

  _defaultOptions() {
    return {
      defaultLogger: {
        name: 'skyer',
        filename: 'log',
        prefix: process.env.LOGGER_PATH_PREFIX,
        maxsize: 1024 * 500, // 500KB
        showLevel: true,
        level: 'info',
        json: false
      }
    };
  }

  _getLoggerPath() {
    const defaultLoggerOpts = this.options.defaultLogger;

    if ( defaultLoggerOpts && defaultLoggerOpts.prefix ) {
      return `${defaultLoggerOpts.prefix}/${defaultLoggerOpts.name}`;
    }

    return `${this.skyer.options.logger_path}/${defaultLoggerOpts.name}`;
  }

  _init() {
    const loggerPath = this._getLoggerPath();

    // todo: mkdirp for other loggers
    mkdirp(loggerPath);

    const DailyRotateFile = require('winston-daily-rotate-file');

    const consoleLogLevel = this.skyer.getEnv('SKYER_CONSOLE_LOG_LEVEL') || 'info';
    const fileLogLevel    = this.skyer.getEnv('SKYER_FILE_LOG_LEVEL') || 'info';

    const options = _.extend(this.options.defaultLogger, {
      dirname: loggerPath,
      timestamp: this._timestamp,
      level: fileLogLevel
    });

    this._skyerLogger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          level: consoleLogLevel,
          colorize: true
        }),
        new (DailyRotateFile)(options)
      ]
    });
  }

  _timestamp() {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS Z');
  }

  _build() {
    super._build();

    return this._skyerLogger;
  }
}

LoggerComponent.alias = 'logger'; // ApiLoggerComponent  => apiLogger

module.exports = LoggerComponent;
