// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Footer, Wrapper } from 'components/Layout';
import { BoldText, Paragraph } from 'components/Typography';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import TextInput from 'components/TextInput';
import Header from 'components/Header';
import Button from 'components/Button';
import ProfileImage from 'components/ProfileImage';
import { validateUserDetailsAction, registerOnBackendAction } from 'actions/onboardingActions';
import { USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME, INVALID_USERNAME } from 'constants/walletConstants';
import { fontSizes, fontWeights } from 'utils/variables';

const { Form } = t.form;
const MIN_USERNAME_LENGTH = 4;
const MAX_USERNAME_LENGTH = 30;

const IntroParagraph = styled(Paragraph)`
  margin: 10px 0 50px;
`;

const LoginForm = styled(Form)``;

const UsernameWrapper = styled(Wrapper)`
  margin: 36px 0 20px;
  align-self: center;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  top: 2px;
`;

const Text = styled(BoldText)`
  line-height: ${fontSizes.large};
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
  width: 100%;
  text-align: center;
  max-width: 230px;
`;

function InputTemplate(locals) {
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    value: locals.value,
    keyboardType: locals.keyboardType,
    style: {
      fontSize: 24,
      lineHeight: 0,
    },
    ...locals.config.inputProps,
  };

  return (
    <TextInput
      errorMessage={errorMessage}
      id={locals.label}
      label={locals.label}
      inputProps={inputProps}
      inputType="secondary"
      noBorder
      loading={locals.config.isLoading}
    />
  );
}
const usernameRegex = /^[a-z]+([a-z0-9-]+[a-z0-9])?$/i;
const startsWithNumberRegex = /^[0-9]/i;
const startsOrEndsWithDash = /(^-|-$)/i;
const Username = t.refinement(t.String, (username): boolean => {
  return username !== null
    && username.length >= MIN_USERNAME_LENGTH
    && username.length <= MAX_USERNAME_LENGTH
    && usernameRegex.test(username);
});

Username.getValidationErrorMessage = (username): string => {
  if (!usernameRegex.test(username)) {
    if (startsWithNumberRegex.test(username)) return 'Username can not start with a number';
    if (startsOrEndsWithDash.test(username)) return 'Username can not start or end with a dash';
    return 'Only use alpha-numeric characters or dashes.';
  }
  if (username.length < MIN_USERNAME_LENGTH) {
    return `Username should be longer than ${MIN_USERNAME_LENGTH - 1} characters.`;
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return `Username should be less than ${MAX_USERNAME_LENGTH + 1} characters.`;
  }

  return 'Please specify the username.';
};

const formStructure = t.struct({
  username: Username,
});

const PROFILE_IMAGE_WIDTH = 144;

const getDefaultFormOptions = (inputDisabled: boolean, isLoading?: boolean) => ({
  fields: {
    username: {
      auto: 'placeholders',
      placeholder: 'Username',
      template: InputTemplate,
      maxLength: MAX_USERNAME_LENGTH,
      config: {
        isLoading,
        inputProps: {
          autoCapitalize: 'none',
          disabled: inputDisabled,
          autoFocus: true,
        },
      },
    },
  },
});

type Props = {
  navigation: NavigationScreenProp<*>,
  validateUserDetails: Function,
  resetWalletState: Function,
  walletState: ?string,
  backupStatus: Object,
  session: Object,
  apiUser: Object,
  retry?: boolean,
  registerOnBackend: Function,
};

type State = {
  value: ?{
    username: ?string,
  },
  formOptions: Object,
};

class NewProfile extends React.Component<Props, State> {
  _form: t.form;

  constructor(props: Props) {
    super(props);
    const { apiUser, backupStatus: { isImported } = {} } = props;
    const value = apiUser && apiUser.username ? { username: apiUser.username } : null;
    const inputDisabled = !!(apiUser && apiUser.id) && !isImported;
    this.state = {
      value,
      formOptions: getDefaultFormOptions(inputDisabled),
    };
  }

  handleChange = (value: Object) => {
    // Because the idea is to display the inputError label on proper circumstances
    // here we don't validate minimum length, that's done on
    // this.renderChooseUsernameScreen() const shouldNextButtonBeDisabled
    const validateUsername = t.validate(value, formStructure);
    const isValidUsername = validateUsername.isValid();
    const { message: errorMessage = '' } = validateUsername.firstError() || {};

    const options = t.update(this.state.formOptions, {
      fields: {
        username: {
          hasError: { $set: !isValidUsername && value.username },
          error: { $set: errorMessage },
        },
      },
    });
    this.setState({ formOptions: options, value });
  };

  validateUsername = () => {
    Keyboard.dismiss();
    const { validateUserDetails } = this.props;

    const value = this._form.getValue();
    if (!value) return;
    validateUserDetails({ username: value.username });
  };

  handleSubmit = () => {
    const { apiUser } = this.props;

    if (apiUser && apiUser.id) {
      this.goToNextScreen();
    }
  };

  componentDidUpdate(prevProps: Props) {
    const { walletState, backupStatus: { isImported } = {} } = this.props;
    if (prevProps.walletState === walletState) return;

    if (walletState === USERNAME_EXISTS || walletState === INVALID_USERNAME) {
      const errorMessage = walletState === USERNAME_EXISTS ? 'Username taken' : 'Invalid username';
      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            hasError: { $set: true },
            error: { $set: errorMessage },
            config: {
              isLoading: { $set: false },
            },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
    }

    if (walletState === CHECKING_USERNAME) {
      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            config: {
              isLoading: { $set: true },
            },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
    }

    if (!isImported && walletState === USERNAME_OK) {
      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            config: {
              isLoading: { $set: false },
            },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
      this.goToNextScreen();
    }
  }

  goToNextScreen() {
    const {
      navigation,
      retry,
      registerOnBackend,
      apiUser,
    } = this.props;
    Keyboard.dismiss();
    if (retry) {
      registerOnBackend();
      return;
    }

    const navigationParams = {};
    if (apiUser && apiUser.id) navigationParams.returningUser = true;
    navigation.navigate(SET_WALLET_PIN_CODE, navigationParams);
  }

  renderChooseUsernameScreen() {
    const { value, formOptions } = this.state;
    const {
      walletState,
      session,
      retry,
    } = this.props;
    const {
      fields: { username: { hasError: usernameHasErrors = false } },
    } = formOptions;

    const isUsernameValid = value && value.username && !usernameHasErrors;
    const isCheckingUsernameAvailability = walletState === CHECKING_USERNAME;
    const shouldNextButtonBeDisabled = !isUsernameValid || isCheckingUsernameAvailability || !session.isOnline;
    const headerTitle = walletState === INVALID_USERNAME ? 'update username' : "let's get started";
    const paragraph = walletState === INVALID_USERNAME ?
      'your current username is invalid for security reasons, please update it.' :
      'Choose your unique username now. It cannot be changed in future.';

    return (
      <React.Fragment>
        <Wrapper>
          <Header
            title={headerTitle}
            onBack={retry ? undefined : () => this.props.navigation.goBack()}
          />
          <Wrapper regularPadding>
            <IntroParagraph light small>
              {paragraph}
            </IntroParagraph>
            <LoginForm
              innerRef={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleChange}
            />
          </Wrapper>
        </Wrapper>
        <Footer>
          {!!isUsernameValid &&
          <Button
            onPress={this.validateUsername}
            disabled={shouldNextButtonBeDisabled}
            title="Next"
          />
          }
        </Footer>
      </React.Fragment>
    );
  }

  renderWelcomeBackScreen() {
    const { apiUser } = this.props;
    return (
      <Wrapper flex={1} center regularPadding>
        <ProfileImage
          uri={apiUser.profileLargeImage}
          diameter={PROFILE_IMAGE_WIDTH}
          style={{ marginBottom: 47 }}
          userName={apiUser.username}
          initialsSize={fontSizes.extraGiant}
        />
        <UsernameWrapper>
          <Text>Welcome back,</Text>
          <Text>{apiUser.username}.</Text>
        </UsernameWrapper>
        <Paragraph small light center style={{ marginBottom: 40, paddingLeft: 40, paddingRight: 40 }}>
          Your Pillar Wallet is now restored. We are happy to see you again.
        </Paragraph>
        <Button marginBottom="20px" onPress={this.handleSubmit} title="Next" />
      </Wrapper>
    );
  }

  render() {
    const {
      walletState,
      apiUser,
      backupStatus: { isImported } = {},
    } = this.props;

    const shouldRenderUsernameScreen = !apiUser.walletId || (isImported && walletState === INVALID_USERNAME);
    const shouldRenderWelcomeBackScreen = isImported && walletState === USERNAME_OK;

    return (
      <Container>
        {shouldRenderWelcomeBackScreen && this.renderWelcomeBackScreen()}
        {shouldRenderUsernameScreen && this.renderChooseUsernameScreen()}
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { walletState, onboarding: { apiUser }, backupStatus },
  session: { data: session },
}) => ({
  walletState,
  backupStatus,
  apiUser,
  session,
});

const mapDispatchToProps = (dispatch) => ({
  validateUserDetails: (user: Object) => dispatch(validateUserDetailsAction(user)),
  registerOnBackend: () => dispatch(registerOnBackendAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewProfile);
