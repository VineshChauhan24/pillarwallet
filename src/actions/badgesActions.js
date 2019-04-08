// @flow
import { UPDATE_BADGES } from 'constants/badgesConstants';
import { saveDbAction } from './dbActions';
import { offlineApiCall } from './offlineApiActions';

export const fetchBadgesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      wallet: { data: wallet },
      badges: { data: badges },
    } = getState();

    const userBadges = await api.fetchBadges(wallet.address);
    if (userBadges && Object.keys(userBadges).length) {
      const ids = Object.keys(userBadges).map(Number);
      const badgesInfo = await api.fetchBadgesInfo(walletId);

      const updatedBadges = ids.map(badgeId => {
        const oldBadgeInfo = badges.find(({ id }) => id === badgeId) || {};
        const badgeInfo = badgesInfo[badgeId] || oldBadgeInfo;
        return {
          ...badgeInfo,
          id: badgeId,
          balance: userBadges[badgeId],
        };
      });

      dispatch(saveDbAction('badges', { badges: updatedBadges }, true));
      dispatch({ type: UPDATE_BADGES, payload: updatedBadges });
    }
  };
};

export const selfAwardBadgeAction = (badgeType: string) => {
  return async (dispatch: Function, getState: Function) => {
    const { user: { data: { walletId } } } = getState();
    dispatch(offlineApiCall('selfAwardBadge', walletId, badgeType));
  };
};
