'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('./mockReactNative');
const { normalizeHost, normalizeOptionalHost } = require('../lib');

test('accepts a plain host and lower-cases it', () => {
  assert.equal(normalizeHost('Offers.Example.com'), 'offers.example.com');
});

test('accepts an https URL and trailing slashes', () => {
  assert.equal(normalizeHost('https://offers.example.com/'), 'offers.example.com');
  assert.equal(normalizeHost('HTTPS://offers.example.com//'), 'offers.example.com');
});

test('accepts a port and trims whitespace', () => {
  assert.equal(normalizeHost('  offers.example.com:8443 '), 'offers.example.com:8443');
});

test('rejects blank, null and undefined', () => {
  assert.throws(() => normalizeHost(''), /host is required/);
  assert.throws(() => normalizeHost('   '), /host is required/);
  assert.throws(() => normalizeHost(null), /host is required/);
  assert.throws(() => normalizeHost(undefined), /host is required/);
});

test('rejects cleartext http and other schemes', () => {
  assert.throws(() => normalizeHost('http://offers.example.com'), /https/);
  assert.throws(() => normalizeHost('ftp://offers.example.com'), /https/);
});

test('rejects paths, queries and embedded whitespace', () => {
  assert.throws(() => normalizeHost('offers.example.com/path'), /plain host name/);
  assert.throws(() => normalizeHost('offers.example.com?x=1'), /plain host name/);
  assert.throws(() => normalizeHost('offers example.com'), /plain host name/);
  assert.throws(() => normalizeHost('-offers.example.com'), /plain host name/);
});

test('names the setting in the error', () => {
  assert.throws(() => normalizeHost('', 'trackerHost'), /trackerHost is required/);
});

test('an optional host may be blank but never invalid', () => {
  assert.equal(normalizeOptionalHost(undefined, 'trackerHost'), undefined);
  assert.equal(normalizeOptionalHost('  ', 'trackerHost'), undefined);
  assert.equal(normalizeOptionalHost('Track.Example.com', 'trackerHost'), 'track.example.com');
  assert.throws(() => normalizeOptionalHost('a b', 'trackerHost'), /trackerHost/);
});
