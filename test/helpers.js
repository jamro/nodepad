import chai from 'chai';
import { mount, render, shallow, configure} from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import React from 'React';
import {JSDOM} from 'jsdom';

chai.use(chaiAsPromised);

configure({ adapter: new Adapter() });

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js',
};
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};
global.HTMLElement = window.HTMLElement;

global.expect = chai.expect;
global.chaiAsPromised = chaiAsPromised;
global.sinon = sinon;
global.chai = chai;
 
global.React = React;
global.mount = mount;
global.render = render;
global.shallow = shallow;