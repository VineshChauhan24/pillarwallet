// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Button as NBButton } from 'native-base';
import { BoldText } from 'components/Typography';
import Icon from 'components/Icon';
import { UIColors, baseColors, fontSizes, spacing, fontWeights } from 'utils/variables';

type Props = {
  children?: React.Node,
  title: string,
  onPress?: Function,
  disabled?: boolean,
  disabledTransparent?: boolean,
  secondary?: boolean,
  danger?: boolean,
  primaryInverted?: boolean,
  dangerInverted?: boolean,
  marginBottom?: string,
  marginTop?: string,
  marginLeft?: string,
  marginRight?: string,
  light?: boolean,
  width?: string,
  block?: boolean,
  noPadding?: boolean,
  flexRight?: boolean,
  small?: boolean,
  extraSmall?: boolean,
  icon?: string,
  iconSize?: string,
  listItemButton?: boolean,
  height?: number,
  textStyle?: ?Object,
};

const themes = {
  primary: {
    background: baseColors.electricBlue,
    color: '#ffffff',
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
    shadow: true,
  },
  primaryInverted: {
    background: baseColors.white,
    color: baseColors.electricBlue,
    borderColor: baseColors.veryLightBlue,
    borderWidth: '1px',
  },
  dangerInverted: {
    background: baseColors.white,
    color: baseColors.burningFire,
    borderColor: baseColors.dawnPink,
    borderWidth: '1px',
  },
  secondary: {
    background: baseColors.white,
    color: baseColors.electricBlue,
    borderColor: baseColors.electricBlue,
    borderWidth: '1px',
  },
  secondaryDanger: {
    background: baseColors.white,
    color: baseColors.fireEngineRed,
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
  },
  danger: {
    background: baseColors.fireEngineRed,
    color: baseColors.white,
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
  },
  dark: {
    background: baseColors.darkGray,
    color: baseColors.white,
    borderColor: baseColors.darkGray,
    borderWidth: 0,
  },
  disabled: {
    background: baseColors.lightGray,
    color: baseColors.darkGray,
    borderColor: UIColors.defaultBorderColor,
    borderWidth: 0,
  },
  disabledTransparent: {
    background: baseColors.electricBlue,
    color: baseColors.white,
    opacity: 0.5,
  },
  square: {
    background: 'transparent',
    color: baseColors.burningFire,
    borderColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'column',
    borderRadius: 0,
    iconHorizontalMargin: 0,
  },
};

const getButtonHeight = (props) => {
  if (props.height) {
    return `${props.height}px`;
  } else if (props.noPadding) {
    return '0';
  } else if (props.small) {
    return '34px';
  }

  return '56px';
};

const getButtonWidth = (props) => {
  if (props.square) {
    return getButtonHeight(props);
  } else if (props.block) {
    return '100%';
  }

  return 'auto';
};

const getButtonPadding = (props) => {
  if (props.noPadding) {
    return '0';
  } else if (props.small || props.block) {
    return `${spacing.rhythm}px`;
  } else if (props.square) {
    return '4px';
  }
  return `${spacing.rhythm * 2.5}px`;
};

const getButtonFontSize = (props) => {
  if (props.listItemButton) {
    return `${fontSizes.small}px`;
  } else if (props.small) {
    return `${fontSizes.extraSmall}px`;
  } else if (props.extraSmall) {
    return `${fontSizes.extraExtraSmall}px`;
  }
  return `${fontSizes.medium}px`;
};

const ButtonIcon = styled(Icon)`
  font-size: ${({ iconSize = 'medium' }) => fontSizes[iconSize]};
  margin-horizontal: ${props => props.theme.iconHorizontalMargin || props.theme.iconHorizontalMargin === 0
    ? props.theme.iconHorizontalMargin
    : props.marginRight || 8}px;
  color: ${props => props.theme.color};
  line-height: ${props => getButtonFontSize(props)};
`;

const ButtonWrapper = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  padding: 0 ${props => getButtonPadding(props)};
  background-color: ${props => props.theme.background};
  opacity: ${props => props.theme.opacity ? props.theme.opacity : 1};
  margin-top: ${props => props.marginTop || '0px'};
  margin-bottom: ${props => props.marginBottom || '0px'};
  margin-left: ${props => props.marginLeft || '0px'};
  margin-right: ${props => props.marginRight || '0px'};
  border-radius: ${props => props.theme.borderRadius || props.theme.borderRadius === 0
    ? props.theme.borderRadius
    : 40}px;
  width: ${props => getButtonWidth(props)};
  height: ${props => getButtonHeight(props)};
  align-self: ${props => props.flexRight ? 'flex-end' : 'auto'} ;
  border-color: ${props => props.theme.borderColor};
  border-width: ${props => props.theme.borderWidth};
  border-style: solid;
  flex-direction: ${props => props.theme.flexDirection ? props.theme.flexDirection : 'row'}
  ${props => props.theme.shadow ? 'box-shadow: 0px 2px 7px rgba(0,0,0,.12);' : ''}
  ${props => props.theme.shadow ? 'elevation: 1;' : ''}
`;

const ButtonText = styled(BoldText)`
  color: ${props => props.theme.color};
  font-size: ${props => getButtonFontSize(props)};
  margin-bottom: ${props => props.extraSmall ? '2px' : 0};
  ${props => props.listItemButton || props.extraSmall ? `font-weight: ${fontWeights.book};` : ''}
  ${props => props.listItemButton || props.extraSmall
    ? 'font-family: Aktiv Grotesk App;'
    : ''}
`;

const ButtonMiniWrapper = styled(NBButton)`
  padding: 10px 20px;
  background-color: ${baseColors.electricBlue};
  border-radius: 17;
  box-shadow: 0px .5px .5px ${baseColors.electricBlue};
  height: 34px;
  width: auto;
`;

const ButtonMiniText = styled(BoldText)`
  font-size: 14px;
  letter-spacing: 0.3;
  color: #fff;
`;

const getTheme = (props: Props) => {
  if (props.secondary && props.danger) {
    return themes.secondaryDanger;
  }

  const propsKeys = Object.keys(props);
  const themesKeys = Object.keys(themes);
  let themeToUse = themes.primary;

  propsKeys.forEach((prop: string) => {
    const indexOfTheme = themesKeys.indexOf(prop);
    const existTheme = indexOfTheme >= 0;

    if (existTheme && props[prop]) {
      themeToUse = themes[prop];
    }
  });

  return themeToUse;
};

const Button = (props: Props) => {
  const theme = getTheme(props);
  const {
    block,
    marginTop,
    marginBottom,
    icon,
    iconSize,
    marginLeft,
    marginRight,
    noPadding,
    disabled,
    disabledTransparent,
    onPress,
    width,
    height,
    children,
  } = props;

  return (
    <ButtonWrapper
      {...props}
      theme={theme}
      block={block}
      marginTop={marginTop}
      marginBottom={marginBottom}
      marginLeft={marginLeft}
      marginRight={marginRight}
      noPadding={noPadding}
      onPress={(disabled || disabledTransparent) ? null : onPress}
      width={width}
      height={height}
      disabled={disabled || disabledTransparent}
    >
      {!!icon &&
        <ButtonIcon
          marginRight={marginRight}
          iconSize={iconSize}
          name={icon}
          theme={theme}
        />
      }
      {!!props.title &&
      <ButtonText
        theme={theme}
        small={props.small}
        extraSmall={props.extraSmall}
        listItemButton={props.listItemButton}
        style={props.textStyle}
      >
        {props.title}
      </ButtonText>}
      {children}
    </ButtonWrapper>
  );
};

export default Button;

type ButtonMiniProps = {
  onPress: Function,
  title: string,
};

export const ButtonMini = (props: ButtonMiniProps) => (
  <ButtonMiniWrapper onPress={props.onPress}>
    <ButtonMiniText>{props.title}</ButtonMiniText>
  </ButtonMiniWrapper>
);
