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
import * as React from 'react';
import { Alert, View, Platform, Linking, AppState } from 'react-native';
import { connect } from 'react-redux';
import { Wrapper } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import {
  GiftedChat,
  Bubble,
  Avatar,
  Composer,
  InputToolbar,
  Send,
  Day,
  Time,
  LoadEarlier,
  Message,
} from 'react-native-gifted-chat';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/Icon';
import {
  sendMessageByContactAction,
  clearChatDraftStateAction,
  getChatByContactAction,
  resetUnreadAction,
  getChatDraftByContactAction,
  saveDraftAction,
} from 'actions/chatActions';
import Spinner from 'components/Spinner';
import { isIphoneX, handleUrlPress } from 'utils/common';
import { CONTACT } from 'constants/navigationConstants';
import { UNDECRYPTABLE_MESSAGE } from 'constants/messageStatus';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  sendMessageByContact: Function,
  clearChatDraftState: Function,
  getChatByContact: Function,
  getChatDraftByContact: Function,
  saveDraft: Function,
  messages: Object,
  isFetching: boolean,
  resetUnread: Function,
  contact: Object,
  chats: any,
  contacts: Object,
  currentMessage: Object,
  draft: ?string,
  isOpen: boolean,
}

type State = {
  contact: Object,
  showLoadEarlierButton: boolean,
  isFetching: boolean,
  chatText: string,
  firstChatLoaded: boolean,
}

const INPUT_HEIGHT = isIphoneX() ? 62 : 52;

const isWarningMessage = (type) => {
  return type === 'warning';
};

// chat elements
const renderBubble = (props: Props) => {
  const isWarning = isWarningMessage(props.currentMessage.type);
  return (<Bubble
    {...props}
    textStyle={{
      left: {
        color: isWarning ? baseColors.white : baseColors.slateBlack,
        fontSize: fontSizes.extraSmall,
        fontFamily: 'Aktiv Grotesk App',
        fontWeight: '400',
      },
      right: {
        color: baseColors.slateBlack,
        fontSize: fontSizes.extraSmall,
        fontFamily: 'Aktiv Grotesk App',
        fontWeight: '400',
      },
    }}
    wrapperStyle={{
      left: {
        backgroundColor: isWarning ? baseColors.brightBlue : baseColors.white,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: isWarning ? baseColors.brightBlue : baseColors.whiterSmoke,
        maxWidth: 262,
        marginTop: 4,
        marginLeft: Platform.select({
          ios: 10,
          android: 16,
        }),
      },
      right: {
        backgroundColor: baseColors.lightYellow,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: baseColors.whiterSmoke,
        maxWidth: 262,
        marginTop: 4,
      },
    }}
    touchableProps={{
      onPress: () => {
        const { status } = props.currentMessage;

        if (status === UNDECRYPTABLE_MESSAGE) {
          // TODO: change the alert message text
          Alert.alert(
            'Cannot decrypt the message',
            'We are using end-to-end encryption. You or your interlocutor should update chat keys.',
          );
        }
      },
    }}
  />);
};

const renderComposer = (props: Props) => {
  return (
    <Composer
      {...props}
      textInputStyle={{
        width: '100%',
        marginTop: Platform.select({
          ios: 12,
          android: 8,
        }),
        marginBottom: 5,
        fontSize: fontSizes.extraSmall,
        lineHeight: fontSizes.small,
      }}
      placeholder="Type your message here"
    />
  );
};

const renderSend = (props: Props) => (
  <Send
    {...props}
    containerStyle={{
      paddingRight: spacing.rhythm,
      paddingLeft: spacing.rhythm,
      marginTop: Platform.select({
        ios: 4,
        android: 6,
      }),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}
  >
    <Icon
      name="send-message"
      style={{
        color: baseColors.brightBlue,
        fontSize: fontSizes.extraLarge,
      }}
    />
  </Send>
);

const renderInputToolbar = (props: Props) => {
  return (
    <InputToolbar
      {...props}
      renderSend={renderSend}
      primaryStyle={{
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: INPUT_HEIGHT,
      }}
      containerStyle={{
        bottom: 2,
        paddingLeft: 8,
        borderColor: baseColors.lightGray,
        margin: 0,
      }}
    />
  );
};

const renderDay = (props: Props) => (
  <Day
    {...props}
    containerStyle={{
      marginTop: 30,
      marginBottom: 36,
    }}
    textStyle={{
      color: baseColors.darkGray,
      fontWeight: '400',
      fontSize: fontSizes.extraSmall,
      fontFamily: 'Aktiv Grotesk App',
    }}
    dateFormat="LL"
  />
);

const renderTime = (props: Props) => {
  return (
    <Time
      {...props}
      textStyle={{
        right: {
          color: baseColors.darkGray,
          fontFamily: 'Aktiv Grotesk App',
          fontWeight: '400',
          fontSize: fontSizes.extraExtraSmall,
        },
        left: {
          color: isWarningMessage(props.currentMessage.type) ? baseColors.veryLightBlue : baseColors.darkGray,
          fontFamily: 'Aktiv Grotesk App',
          fontWeight: '400',
          fontSize: fontSizes.extraExtraSmall,
        },
      }}
      timeFormat="HH:mm"
    />
  );
};

const renderLoadEarlier = (props: Props) => (
  <LoadEarlier
    {...props}
    containerStyle={{
      marginTop: 70,
    }}
  />
);

const renderMessage = (props: Props) => (
  <Message
    {...props}
    containerStyle={{
      left: {
        paddingLeft: 10,
      },
      right: {
        paddingRight: 10,
      },
    }}
  />
);

const parsePatterns = () => [
  {
    type: 'url',
    style: { color: baseColors.clearBlue },
    onPress: (url) => handleUrlPress(url),
  },
  {
    type: 'email',
    style: { color: baseColors.clearBlue },
    onPress: (email) => Linking.openURL(`mailto:${email}`),
  },
  {
    type: 'phone',
    style: { color: baseColors.clearBlue },
    onPress: (phone) => Linking.openURL(`tel:${phone}`),
  },
];

class ChatTab extends React.Component<Props, State> {
  static defaultProps = {
    isOpen: false,
  };

  constructor(props) {
    super(props);
    const contact = props.contacts.find(c => c.username === this.props.contact.username) || {};
    this.state = {
      contact,
      showLoadEarlierButton: false, // make dynamic depending on number of messages in memory?
      isFetching: true,
      chatText: '',
      firstChatLoaded: true, // check this issue https://github.com/FaridSafi/react-native-gifted-chat/issues/638
    };
  }

  componentDidMount() {
    const { contact } = this.state;
    const {
      getChatByContact,
      getChatDraftByContact,
      isOpen,
      chats,
      navigation,
      resetUnread,
    } = this.props;
    const chatInfo = chats.find(({ username }) => username === contact.username);

    if (!chatInfo.unread) getChatByContact(contact.username, contact.id, contact.profileImage);
    if (isOpen) {
      getChatByContact(contact.username, contact.id, contact.profileImage);
      resetUnread(this.state.contact.username);
      navigation.setParams({ chatTabOpen: true });
    }
    AppState.addEventListener('change', this.shouldPersistDraft);

    getChatDraftByContact(contact.id);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      isFetching,
      draft,
      isOpen,
      getChatByContact,
      resetUnread,
      navigation,
    } = this.props;
    const { contact } = this.state;
    const { draft: prevDraft } = prevProps;

    if (this.state.isFetching && !isFetching) {
      this.setState({ isFetching: false }); // eslint-disable-line
    }

    if (!prevDraft && draft) {
      this.setState({ chatText: draft }); // eslint-disable-line
    }

    if (prevProps.isOpen !== isOpen && isOpen) {
      navigation.setParams({ chatTabOpen: true });
      getChatByContact(contact.username, contact.id, contact.profileImage);
      resetUnread(this.state.contact.username);
    }

    if (prevProps.isOpen !== isOpen && !isOpen) {
      navigation.setParams({ chatTabOpen: false });
    }
  }

  componentWillUnmount() {
    const { saveDraft, clearChatDraftState, navigation } = this.props;
    const { chatText, contact } = this.state;
    navigation.setParams({ chatTabOpen: false });

    AppState.removeEventListener('change', this.shouldPersistDraft);

    if (chatText && chatText !== '') {
      saveDraft(contact.id, chatText);
    }

    clearChatDraftState();
  }

  shouldPersistDraft = (nextAppState) => {
    const { saveDraft } = this.props;
    const { chatText, contact } = this.state;

    if (nextAppState === 'inactive' || nextAppState === 'background') {
      saveDraft(contact.id, chatText);
    }
  };

  handleLoadEarlier = () => {
    const { getChatByContact } = this.props;
    const { contact } = this.state;
    getChatByContact(contact.username, contact.id, contact.profileImage, true);
    this.setState({
      showLoadEarlierButton: false,
    });
  };

  onSend = (messages: Object[] = []) => {
    const { sendMessageByContact, clearChatDraftState } = this.props;
    const { contact } = this.state;

    sendMessageByContact(contact.username, messages[0]);
    clearChatDraftState();
    this.setState({ chatText: '' });
  };

  handleNavigationToContact = () => {
    const { navigation, resetUnread } = this.props;
    const { contact } = this.state;
    resetUnread(this.state.contact.username);
    navigation.navigate(CONTACT, { contact });
  };

  renderCustomAvatar = () => {
    const { contact } = this.state;
    return (
      <ProfileImage
        uri={contact.profileImage}
        userName={contact.username}
        diameter={34}
        onPress={this.handleNavigationToContact}
        textStyle={{
          fontSize: 16,
        }}
      />
    );
  };

  renderAvatar = () => {
    const { contact } = this.state;
    return (
      <Avatar
        {...contact}
        renderAvatar={this.renderCustomAvatar}
        containerStyle={{
          left: {
            marginRight: Platform.select({
              ios: -2,
              android: -14,
            }),
          },
        }}
      />
    );
  };

  updateChatInput = (text) => {
    const { firstChatLoaded } = this.state;

    if (firstChatLoaded) {
      this.setState({ firstChatLoaded: false });
    } else {
      this.setState({ chatText: text });
    }
  };

  render() {
    const { messages, isOpen, chats } = this.props;
    const {
      contact,
      showLoadEarlierButton,
      chatText,
    } = this.state;

    const chatInfo = chats.find(({ username }) => username === contact.username);
    const { lastMessage, unread } = chatInfo;

    let messagesToShow = [];

    if (unread && !isOpen) {
      messagesToShow = [
        {
          _id: 1,
          text: unread > 1 ? 'New Messages' : 'New Message',
          createdAt: lastMessage.serverTimestamp,
          user: {
            _id: contact.username,
            name: contact.username,
            avatar: contact.profileImage,
          },
        },
      ];
    } else if (messages[contact.username] && messages[contact.username].length) {
      messagesToShow = messages[contact.username];
    } else {
      messagesToShow = [
        {
          _id: 1,
          text: 'NO MESSAGES',
          createdAt: lastMessage.serverTimestamp,
          system: true,
        },
      ];
    }

    return (
      <Wrapper flex={1}>
        {!!this.state.isFetching &&
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Spinner />
          </View>}
        {!this.state.isFetching &&
          <GiftedChat
            text={chatText}
            onInputTextChanged={this.updateChatInput}
            messages={messagesToShow}
            onSend={msgs => this.onSend(msgs)}
            user={{
              _id: this.props.user.username,
            }}
            renderBubble={renderBubble}
            renderAvatar={this.renderAvatar}
            renderComposer={renderComposer}
            renderInputToolbar={renderInputToolbar}
            renderDay={isOpen ? renderDay : () => null}
            loadEarlier={showLoadEarlierButton}
            onLoadEarlier={this.handleLoadEarlier}
            renderLoadEarlier={renderLoadEarlier}
            renderMessage={renderMessage}
            renderTime={renderTime}
            minInputToolbarHeight={INPUT_HEIGHT}
            parsePatterns={parsePatterns}
            // scrollToBottom={false}
            // renderSystemMessage={() => { <View></View> }}
          />}
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  chat: { data: { messages, isFetching, chats }, draft },
  contacts: { data: contacts },
}) => ({
  user,
  messages,
  isFetching,
  chats,
  contacts,
  draft,
});

const mapDispatchToProps = (dispatch) => ({
  getChatByContact: (
    username,
    userId,
    avatar,
    loadEarlier,
  ) => dispatch(getChatByContactAction(username, userId, avatar, loadEarlier)),
  sendMessageByContact: (username: string, message: Object) => {
    dispatch(sendMessageByContactAction(username, message));
  },
  clearChatDraftState: () => dispatch(clearChatDraftStateAction()),
  resetUnread: (contactUsername) => dispatch(resetUnreadAction(contactUsername)),
  getChatDraftByContact: (contactId: string) => dispatch(getChatDraftByContactAction(contactId)),
  saveDraft: (contactId: string, draftText: string) => dispatch(saveDraftAction(contactId, draftText)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatTab);