// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
// This script runs at the beginning of all unit tests
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { View as mockView } from 'react-native';
import { utils } from 'ethers';
import StorageMock from './asyncStorageMock';
import FirebaseMock from './firebaseMock';

jest.mock('NativeAnimatedHelper');

Enzyme.configure({ adapter: new Adapter() });
const storageCache = {};
const AsyncStorage = new StorageMock(storageCache);

jest.setMock('AsyncStorage', AsyncStorage);
jest.setMock('react-native-firebase', FirebaseMock);
jest.setMock('cryptocompare', {
  priceMulti: (tokensArray, priceMulti) => { // eslint-disable-line
    return Promise.resolve({});
  },
});

jest.setMock('react-native-splash-screen', {
  show: jest.fn(),
  hide: jest.fn(),
});

jest.setMock('react-native-scrypt', () => Promise.resolve('xxxx'));

jest.setMock('react-native-permissions', {
  request: () => Promise.resolve('AUTHORIZED'),
});

const mockWallet: Object = {
  address: '0x9c',
  privateKey: '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9',
};

Object.defineProperty(mockWallet, 'RNencrypt', {
  value: () => Promise.resolve({ address: 'encry_pted' }),
});

const mockInjectedProvider = {
  getBalance: () => Promise.resolve(1), // dummy balance
};

jest.setMock('ethers', {
  Wallet: {
    fromMnemonic: () => mockWallet,
    RNfromEncryptedWallet: () => mockWallet,
  },
  utils: {
    parseEther: x => x,
    bigNumberify: x => x,
    id: utils.id,
    getAddress: utils.getAddress,
  },
  providers: {
    getDefaultProvider: () => mockInjectedProvider,
    JsonRpcProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    EtherscanProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
    FallbackProvider: jest.fn().mockImplementation(() => mockInjectedProvider),
  },
});

jest.setMock('react-native-background-timer', {
  runBackgroundTimer: () => {},
  stopBackgroundTimer: () => {},
});

jest.setMock('react-native-device-info', {
  getUniqueID: () => '1x1x1x1x1x1x1',
});

jest.setMock('react-native-intercom', {
  addListener: () => { },
  removeListener: () => { },
  registerIdentifiedUser: () => { },
  Notifications: { UNREAD_COUNT: 'UNREAD_COUNT' },
  reset: () => { },
  setInAppMessageVisibility: () => { },
  sendTokenToIntercom: () => Promise.resolve(),
});

jest.setMock('rn-signal-protocol-messaging', {
  SignalClient: {
    getExistingMessages: () => Promise.resolve(),
    createClient: () => Promise.resolve(),
    init: () => Promise.resolve(),
    sendMessageByContact: () => Promise.resolve(),
    sendSilentMessageByContact: () => Promise.resolve(),
    receiveNewMessagesByContact: () => Promise.resolve(),
    registerAccount: () => Promise.resolve(),
    setFcmId: () => Promise.resolve(),
  },
});

const mockCameraView = mockView;

// ouch
mockCameraView.Constants = {
  Type: {
    back: 'back',
  },
};

jest.setMock('react-native-camera', {
  RNCamera: mockCameraView,
});

jest.setMock('react-native-vector-icons', {
  createIconSet: () => mockView,
});


function BCXSDK() {
  return {
    txHistory: () => Promise.resolve({ txHistory: { txHistory: [] } }),
    getBalance: () => Promise.resolve({ balance: { ticker: 'ETH', balance: 1 } }),
  };
}

jest.setMock('blockchain-explorer-sdk', BCXSDK);

const mockExchangeRates = {
  ETH: {
    EUR: 624.21,
    GBP: 544.57,
    USD: 748.92,
  },
};

jest.setMock('cryptocompare', {
  priceMulti: () => Promise.resolve(mockExchangeRates),
});

jest.setMock('react-native-share', {});

jest.setMock('react-native-cached-image', {
  ImageCacheManager: () => ({
    clearCache: () => Promise.resolve(),
  }),
  CachedImage: jest.fn(),
});
