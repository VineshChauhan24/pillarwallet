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
import { transformAssetsToObject } from 'utils/assets';
import { PillarSdk } from '@pillarwallet/pillarwallet-nodejs-sdk';
import BCX from 'blockchain-explorer-sdk';
import { Sentry } from 'react-native-sentry';
import {
  SDK_PROVIDER,
  BCX_URL,
  NOTIFICATIONS_URL,
  INVESTMENTS_URL,
  OPEN_SEA_API,
  OPEN_SEA_API_KEY,
} from 'react-native-dotenv'; // SDK_PROVIDER, ONLY if you have platform running locally
import type { Asset } from 'models/Asset';
import type { Transaction } from 'models/Transaction';
import type { UserBadgesResponse, BadgesInfoResponse, SelfAwardBadgeResponse } from 'models/Badge';
import {
  fetchAssetBalances,
  fetchLastBlockNumber,
  fetchTransactionInfo,
  fetchTransactionReceipt,
} from 'services/assets';
import { fetchBadges } from 'services/badges';
import { USERNAME_EXISTS, REGISTRATION_FAILED } from 'constants/walletConstants';
import { isTransactionEvent } from 'utils/history';
import type { OAuthTokens } from 'utils/oAuth';
import { getLimitedData } from 'utils/opensea';

// temporary here
import { icoFundingInstructions as icoFundingInstructionsFixtures } from 'fixtures/icos';

const USERNAME_EXISTS_ERROR_CODE = 409;

type HistoryPayload = {
  address1: string,
  address2?: string,
  asset?: string,
  nbTx?: number,
  fromIndex: number,
};

type BalancePayload = {
  address: string,
  assets: Asset[],
};

type UserInfoByIdPayload = {
  walletId: string,
  userAccessKey: string,
  targetUserAccessKey: string,
};

const BCXSdk = new BCX({ apiUrl: BCX_URL });

export default function SDKWrapper() {
  this.pillarWalletSdk = null;
}

SDKWrapper.prototype.init = function (
  updateOAuth?: ?Function,
  oAuthTokensStored?: ?OAuthTokens,
  onOAuthTokensFailed?: ?Function,
) {
  this.pillarWalletSdk = new PillarSdk({
    apiUrl: SDK_PROVIDER, // ONLY if you have platform running locally
    notificationsUrl: NOTIFICATIONS_URL,
    investmentsUrl: INVESTMENTS_URL,
    updateOAuthFn: updateOAuth,
    oAuthTokens: oAuthTokensStored,
    tokensFailedCallbackFn: onOAuthTokensFailed,
  });
};

SDKWrapper.prototype.registerOnBackend = function (fcm: string, username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.wallet.register({ fcmToken: fcm, username }))
    .then(({ data }) => data)
    .catch((e = {}) => {
      if (e.response && e.response.status === USERNAME_EXISTS_ERROR_CODE) {
        return {
          error: true,
          reason: USERNAME_EXISTS,
        };
      }
      return {
        error: true,
        reason: REGISTRATION_FAILED,
      };
    });
};

SDKWrapper.prototype.registerOnAuthServer = function (walletPrivateKey: string, fcm: string, username: string) {
  const privateKey = walletPrivateKey.indexOf('0x') === 0 ? walletPrivateKey.slice(2) : walletPrivateKey;
  return Promise.resolve()
    .then(() => {
      return this.pillarWalletSdk.wallet.registerAuthServer({
        privateKey,
        fcmToken: fcm,
        username,
      });
    })
    .then(({ data }) => data)
    .catch((e = {}) => {
      Sentry.captureException({
        type: 'Registration error',
        error: e,
      });
      if (e.response && e.response.status === USERNAME_EXISTS_ERROR_CODE) {
        return {
          error: true,
          reason: USERNAME_EXISTS,
        };
      }
      return {
        error: true,
        reason: REGISTRATION_FAILED,
      };
    });
};

SDKWrapper.prototype.fetchInitialAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.defaults({ walletId }))
    .then(({ data }) => data)
    .catch(() => [])
    .then(transformAssetsToObject);
};


SDKWrapper.prototype.updateUser = function (user: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.update(user))
    .then(({ data }) => ({ responseStatus: 200, ...data.user, walletId: user.walletId }))
    .catch((error) => {
      const {
        response: {
          status,
          data: { message } = {},
        },
      } = error;
      Sentry.captureException({
        error: 'Failed to update user',
        walletId: user.walletId,
        user,
        status,
        message,
      });
      return { responseStatus: status, message };
    });
};

SDKWrapper.prototype.updateUserAvatar = function (walletId: string, formData: Object) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.uploadProfileImageFormData(walletId, formData))
    .then(({ data }) => ({ profileImage: data.profileImage, walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.getUserAvatar = function (userId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.imageByUserId(userId))
    .catch(() => null);
};

SDKWrapper.prototype.userInfo = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.info({ walletId }))
    .then(({ data }) => ({ ...data, walletId }))
    .catch(() => ({}));
};

SDKWrapper.prototype.userInfoById = function (targetUserId: string, params: UserInfoByIdPayload) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.infoById(targetUserId, params))
    .then(({ data }) => ({ ...data }))
    .catch(() => ({}));
};

SDKWrapper.prototype.userSearch = function (query: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.search({ query, walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.usernameSearch = function (username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.usernameSearch({ username }))
    .then(({ data }) => data)
    .catch((error) => {
      const {
        response: {
          status,
          data: { message } = {},
        },
      } = error;

      switch (status) {
        case 400:
          return { status, message };
        default:
          return {};
      }
    });

  // TODO: handle 404 and other errors in different ways (e.response.status === 404)
};

SDKWrapper.prototype.validateAddress = function (blockchainAddress: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.validate({ blockchainAddress }))
    .then(({ data }) => data)
    .catch(() => ({}));
};

SDKWrapper.prototype.fetchSupportedAssets = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.list({ walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.assetsSearch = function (query: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.asset.search({ query, walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.fetchCollectibles = function (walletAddress: string) {
  return new Promise((resolve, reject) => {
    getLimitedData(`${OPEN_SEA_API}/assets/?owner=${walletAddress}&order_by=listing_date&order_direction=asc`,
      [], 300, 0, 'assets', resolve, reject);
  })
    .then(response => ({ assets: response }))
    .catch(() => ({ error: true }));
};

SDKWrapper.prototype.fetchCollectiblesTransactionHistory = function (walletAddress: string) {
  return Promise.resolve()
    .then(() => fetch(`${OPEN_SEA_API}/events/?account_address=${walletAddress}&event_type=transfer`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': OPEN_SEA_API_KEY,
      },
    }))
    .then(data => data.json())
    .catch(() => ({ error: true }));
};

SDKWrapper.prototype.fetchNotifications = function (walletId: string, type: string, fromTimestamp?: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.notification.list({
      walletId,
      fromTimestamp,
      type,
    }))
    .then(({ data }) => data)
    .then(({ notifications }) => notifications)
    .then(notifications => {
      return notifications.map(notification => {
        if (!isTransactionEvent(notification.type)) return notification;

        const {
          type: notificationType,
          payload: {
            fromAddress,
            toAddress,
            txHash,
            ...restPayload
          },
          ...rest
        } = notification;

        return {
          type: notificationType,
          payload: {
            to: toAddress,
            from: fromAddress,
            hash: txHash,
            ...restPayload,
          },
          ...rest,
        };
      });
    })
    .catch(() => []);
};

SDKWrapper.prototype.fetchICOs = function (userId: string) { //eslint-disable-line
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.investments.icoList({ userId }))
    .then(({ data }) => data.data)
    .catch(() => []);
};

SDKWrapper.prototype.fetchICOFundingInstructions = function (walletId, currency) {
  const cryptos = ['ETH', 'BTC', 'LTC']; // mock purposes;
  const fixtures = {
    ...icoFundingInstructionsFixtures,
    currency,
    paymentType: cryptos.includes(currency) ? 'crypto_currency' : 'bank_transfer',
  };
  return Promise.resolve(fixtures);
};

SDKWrapper.prototype.fetchHistory = function (payload: HistoryPayload) {
  return BCXSdk.txHistory(payload)
    .then(({ txHistory: { txHistory } }) => txHistory)
    .then(history => {
      return history.map(({
        fromAddress,
        toAddress,
        txHash,
        timestamp,
        ...rest
      }): Transaction => ({
        to: toAddress,
        from: fromAddress,
        hash: txHash,
        createdAt: timestamp || 0,
        ...rest,
      }));
    })
    .catch(() => []);
};

SDKWrapper.prototype.fetchGasInfo = function () {
  return fetch('https://www.etherchain.org/api/gasPriceOracle')
    .then(data => data.json())
    .then(data => ({
      min: data.safeLow,
      avg: data.standard,
      max: data.fast,
    }))
    .catch(() => ({}));
  // return BCXSdk.gasInfo({ nBlocks: 10 })
  //   .then(({ gasUsed }) => gasUsed)
  //   .catch(() => ({}));
};

SDKWrapper.prototype.fetchTxInfo = function (hash: string) {
  return fetchTransactionInfo(hash);
};

SDKWrapper.prototype.fetchTransactionReceipt = function (hash: string) {
  return fetchTransactionReceipt(hash);
};

SDKWrapper.prototype.fetchLastBlockNumber = function () {
  return fetchLastBlockNumber();
};

SDKWrapper.prototype.fetchBalances = function ({ address, assets }: BalancePayload) {
  // TEMPORARY FETCH FROM BLOCKCHAIN DIRECTLY
  return fetchAssetBalances(assets, address);
  // const promises = assets.map(async ({ symbol, address: contractAddress }) => {
  //   const payload = { contractAddress, address, asset: symbol };
  //   const { balance: response } = await BCXSdk.getBalance(payload);
  //   return { balance: response.balance, symbol: response.ticker };
  // });
  // return Promise.all(promises).catch(() => []);
};

SDKWrapper.prototype.fetchBadges = function (address: string): Promise<UserBadgesResponse> {
  return fetchBadges(address).catch(() => ({}));
};

SDKWrapper.prototype.fetchBadgesInfo = function (walletId: string): Promise<BadgesInfoResponse> {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.badge.my({ walletId }))
    .then(({ data }) => data)
    .then(data => data.reduce((memo, badge) => ({ ...memo, [badge.id]: badge }), {}))
    .catch(() => ({}));
};

SDKWrapper.prototype.selfAwardBadge = function (walletId: string, event: string): Promise<SelfAwardBadgeResponse | {}> {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.badge.selfAward({ walletId, event }))
    .then(({ data }) => data)
    .catch(() => ({}));
};

SDKWrapper.prototype.sendInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.invite({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.cancelInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.cancel({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.acceptInvitation = function (
  targetUserId: string,
  targetUserAccessKey: string,
  accessKey: string,
  walletId: string,
) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.accept({
      sourceUserAccessKey: accessKey,
      targetUserId,
      targetUserAccessKey,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.rejectInvitation = function (targetUserId: string, accessKey: string, walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.connection.reject({
      accessKey,
      targetUserId,
      walletId,
    }))
    .then(({ data }) => data)
    .catch(() => null);
};

SDKWrapper.prototype.disconnectUser =
  function (targetUserId: string, sourceUserAccessKey: string, targetUserAccessKey: string, walletId: string) {
    return Promise.resolve()
      .then(() => this.pillarWalletSdk.connection.disconnect({
        targetUserId,
        sourceUserAccessKey,
        targetUserAccessKey,
        walletId,
      }))
      .then(({ data }) => data)
      .catch(() => null);
  };

SDKWrapper.prototype.fetchAccessTokens = function (walletId: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.user.accessTokens({ walletId }))
    .then(({ data }) => data)
    .catch(() => []);
};

SDKWrapper.prototype.setUsername = function (username: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.configuration.setUsername(username))
    .catch(() => null);
};

SDKWrapper.prototype.approveLoginToExternalResource = function (loginToken: string) {
  return Promise.resolve()
    .then(() => this.pillarWalletSdk.register.approveExternalLogin({ loginToken }))
    .catch(error => {
      Sentry.captureException({
        type: 'External login approve error',
        error,
      });
      return { error };
    });
};
