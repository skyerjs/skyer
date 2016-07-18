# Skyer

[![npm version](https://badge.fury.io/js/skyer.svg)](https://badge.fury.io/js/skyer)

> MVC framework base koa.

## Install

[![NPM](https://nodei.co/npm/skyer.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/skyer/)

```bash
$ npm install --save skyer
```

## Usage

```js
const Skyer = require('skyer');

console.log('Skyer version:%s', Skyer.version);

const skyer = new Skyer();
skyer.fly();
```
Then

```bash
$ curl http://localhost:3000/
```

Hello skyer!

## Example
[skyer-example](https://github.com/skyerjs/skyer-example)

![image](https://github.com/skyerjs/skyer/blob/master/example/app.png)

## Licences

[MIT](LICENSE)