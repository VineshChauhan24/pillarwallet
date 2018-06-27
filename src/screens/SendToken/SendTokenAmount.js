// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Text, TouchableOpacity, KeyboardAvoidingView as RNKeyboardAvoidingView } from 'react-native';
import t from 'tcomb-form-native';
import { utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
import SingleInput from 'components/TextInput/SingleInput';
import { ButtonMini } from 'components/Button';
import { SEND_TOKEN_CONTACTS } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import { SubTitle, TextLink, Paragraph } from 'components/Typography';
import ModalScreenHeader from 'components/ModalScreenHeader';
import type { TransactionPayload } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import { parseNumber, formatAmount, isValidNumber } from 'utils/common';

const provider = providers.getDefaultProvider(NETWORK_PROVIDER);

const { Form } = t.form;
const gasLimit = 21000;

const getFormStructure = (maxAmount: number, enoughForFee) => {
  const Amount = t.refinement(t.String, (amount): boolean => {
    if (!isValidNumber(amount.toString())) return false;

    amount = parseNumber(amount.toString());
    return enoughForFee && amount > 0 && amount <= maxAmount;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (!isValidNumber(amount.toString())) {
      return 'Incorrect number entered.';
    }

    amount = parseNumber(amount.toString());
    if (amount >= maxAmount) {
      return 'Amount should not exceed the total balance.';
    } else if (!enoughForFee) {
      return 'Not enough eth to process the transaction fee';
    }
    return 'Amount should be specified.';
  };

  return t.struct({
    amount: Amount,
  });
};

function AmountInputTemplate(locals) {
  const { config: { icon } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoFocus: true,
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: '0.00',
    value: locals.value,
    ellipsizeMode: 'middle',
    keyboardType: 'numeric',
    textAlign: 'right',
  };

  return (
    <SingleInput
      innerImageURI={icon}
      errorMessage={errorMessage}
      id="amount"
      inputProps={inputProps}
      inlineLabel
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    amount: {
      template: AmountInputTemplate,
      config,
      transformer: {
        parse: (str = '') => str.toString(),
        format: (value = '') => value.toString(),
      },
    },
  },
});

const KeyboardAvoidingView = styled(RNKeyboardAvoidingView)`
  flex: 1;
  position: absolute;
  bottom: 40;
  left: 0;
  width: 100%;
`;

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

const FooterWrapper = styled.View`
  flexDirection: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

type Props = {
  token: string;

  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  formValues?: Object,
  assets: Object,
}

type State = {
  value: ?{
    amount: ?number
  },
  formStructure: t.struct,
  txFeeInWei: ?Object, // BigNumber
}

class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  gasPrice: Object; // BigNumber
  gasPriceFetched: boolean = false;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      value: null,
      formStructure: getFormStructure(this.assetData.balance, false),
      txFeeInWei: null,
    };
  }

  componentDidMount() {
    provider.getGasPrice()
      .then(gasPrice => {
        this.gasPriceFetched = true;
        this.gasPrice = gasPrice;
        const { token, balance } = this.assetData;
        const { assets } = this.props;
        const txFeeInWei = gasPrice.mul(gasLimit);
        const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);
        const enoughForFee = this.checkIfEnoughForFee(assets, txFeeInWei);

        this.setState({
          txFeeInWei,
          formStructure: getFormStructure(maxAmount, enoughForFee),
        });
      })
      .catch(() => { });
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    const { txFeeInWei } = this.state;
    const { navigation } = this.props;

    if (!value || !this.gasPriceFetched) return;

    const transactionPayload: TransactionPayload = {
      to: '',
      amount: parseNumber(value.amount),
      gasLimit,
      gasPrice: this.gasPrice.toNumber(),
      txFeeInWei: txFeeInWei ? txFeeInWei.toNumber() : 0,
      symbol: this.assetData.symbol,
      contractAddress: this.assetData.contractAddress,
    };
    navigation.navigate(SEND_TOKEN_CONTACTS, {
      assetData: this.assetData,
      transactionPayload,
    });
  };

  useMaxValue = () => {
    if (!this.gasPriceFetched) return;
    const { txFeeInWei } = this.state;
    const { token, balance } = this.assetData;
    const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);

    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    });
  };

  calculateMaxAmount(token: string, balance: number, txFeeInWei: ?Object): number {
    if (token !== ETH) {
      return balance;
    }
    const maxAmount = utils.parseUnits(balance.toString(), 'ether').sub(txFeeInWei);
    if (maxAmount.lt(0)) return 0;
    return new BigNumber(utils.formatEther(maxAmount)).toNumber();
  }

  checkIfEnoughForFee(assets: Assets, txFeeInWei): boolean {
    if (!assets[ETH]) return false;
    const ethBalance = assets[ETH].balance;
    const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
    return balanceInWei.gte(txFeeInWei);
  }
  render() {
    const {
      value,
      formStructure,
      txFeeInWei,
    } = this.state;
    const { token, icon, balance } = this.assetData;
    const formOptions = generateFormOptions({ icon, currency: token });
    return (
      <React.Fragment>
        <ModalScreenHeader
          onClose={this.props.navigation.dismiss}
          rightLabelText="step 1 of 3"
          title="send"
        />
        <Container>
          <Wrapper regularPadding>
            <SubTitle>How much {token} would you like to send?</SubTitle>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleChange}
            />
            <ActionsWrapper>
              <Paragraph style={{ marginRight: 24 }}>Balance {balance} {token}</Paragraph>
              <TouchableOpacity onPress={this.useMaxValue}>
                <TextLink>Send All</TextLink>
              </TouchableOpacity>
            </ActionsWrapper>
          </Wrapper>
        </Container>
        <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={30}>
          <FooterWrapper>
            <Text>Fee <TextLink> {txFeeInWei && ` ${utils.formatEther(txFeeInWei.toString())} ETH`}</TextLink></Text>
            <ButtonMini title="Next" onPress={this.handleFormSubmit} />
          </FooterWrapper>
        </KeyboardAvoidingView>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({ assets: { data: assets } }) => ({
  assets,
});

export default connect(mapStateToProps)(SendTokenAmount);