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
import { TouchableOpacity, Platform } from 'react-native';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { BoldText } from 'components/Typography';


type Props = {
  title?: string,
  style?: Object,
  noMargin?: boolean,
  align?: string,
  fullWidth?: boolean,
  subtitle?: boolean,
  maxWidth?: number,
  noBlueDot?: boolean,
  dotColor?: string,
  onTitlePress?: Function,
  titleStyles?: ?Object,
};

const Wrapper = styled.View`
  margin: ${props => props.noMargin ? '0' : '16px 0'};
  align-self: ${props => props.align ? props.align : 'flex-start'};
  position: relative;
  top: 0;
  ${({ maxWidth }) => maxWidth && `
    width: maxWidth;
  `}
  ${({ fullWidth, align }) => fullWidth && align !== 'center' ? 'width: 100%;' : ''}
  ${({ align }) => align === 'center' && `
    flex-direction: row;
    align-items: center;
  `}
`;

const Text = styled(BoldText)`
  line-height: ${fontSizes.extraLarger};
  font-size: ${props => props.subtitle ? fontSizes.medium : fontSizes.large};
  font-weight: ${fontWeights.bold};
  ${({ align }) => align === 'center' && `
    line-height: 25px;
    text-align: center;
  `}
`;

const BlueDot = styled(BoldText)`
  color: ${baseColors.brightSkyBlue};
  font-size: ${Platform.OS === 'ios' ? 30 : 26}px;
`;


/**
 *  this separate definition has to stay here as it affects font rendering
 *  otherwise if it's taken then once font is being shorten with ellipsis
 *  on Android it gets cut
 */
const AktivTextTitle = styled(Text)`
  fontFamily: 'Aktiv Grotesk App${Platform.OS === 'android' ? '_bold' : ''};
`;

const Title = (props: Props) => {
  const ellipsized = !props.fullWidth ? {
    ellipsizeMode: 'middle',
    numberOfLines: 1,
  } : {};

  const {
    noMargin,
    style,
    align,
    maxWidth,
    fullWidth,
    subtitle,
    onTitlePress,
    titleStyles,
    title,
    noBlueDot,
    dotColor,
  } = props;

  const noBlueDotNeeded = noBlueDot || !title;

  return (
    <Wrapper
      noMargin={noMargin}
      style={style}
      align={align}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      {onTitlePress ?
        <TouchableOpacity onPress={onTitlePress}>
          <AktivTextTitle
            align={align}
            subtitle={subtitle}
            {...ellipsized}
            style={titleStyles}
            fullWidth={fullWidth}
          >
            {title}
            {!subtitle && !noBlueDotNeeded && <BlueDot dotColor={dotColor}>.</BlueDot>}
          </AktivTextTitle>
        </TouchableOpacity>
        :
        <AktivTextTitle
          align={align}
          subtitle={subtitle}
          {...ellipsized}
          style={titleStyles}
          fullWidth={fullWidth}
        >
          {title}
          {!subtitle && !noBlueDotNeeded && <BlueDot dotColor={dotColor}>.</BlueDot>}
        </AktivTextTitle>
      }
    </Wrapper>
  );
};

export default Title;
