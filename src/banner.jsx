import React, { Component } from 'react';

import PropTypes from 'prop-types';

/**
 * Banner component
 * @author [Jose Antonio Ciccio](https://github.com/jciccio)
 */

class Banner extends Component {
  constructor(props) {
    super(props);
     this.state = {
      visibleTime: 0,
      show: undefined,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.visibleTime !== undefined && nextProps.visibleTime > 0) {
        return {
        ...prevState,
        bannerMessage: nextProps.bannerMessage,
        visibleTime: nextProps.visibleTime,
      };
    }

    if (nextProps.setShowBanner !== undefined) {
      return {
        ...prevState,
        show: nextProps.showBanner,
      };
    }
    return null;
  }

  render() {
    // let appearTime = this.props.transitionAppearTime ? this.props.transitionAppearTime : 1000;
    // let transitionTime = this.props.transitionTime ? this.props.transitionTime : 1000;
    return (
      this.renderBanner()
    );
  }

  renderImage() {
    if (this.props.image && this.props.imageClass) {
      return (
        <img
          src={this.props.image}
          className={this.props.imageClass}
        />
      );
    } if (this.props.image) {
      return (
        <img
          src={this.props.image}
        />
      );
    }
      return null;
  }

  async hideBanner() {
    if (this.props.visibleTime !== undefined && this.props.visibleTime > 0) {
      await this.timeout(1000 + this.props.visibleTime);
      this.close();
    }
  }

  close() {
    if (this.props.setShowBanner !== undefined) {
      this.props.setShowBanner(false);
    }
    this.setState({ show: false });
  }

  renderBanner() {
    const classNames = this.props.className ? `banner ${this.props.className}` : 'banner';
    const showBanner = this.props.showBanner !== undefined ? this.props.showBanner : true;
    if (showBanner) {
      if (this.props.title && (this.state.show === undefined || this.state.show)) {
        this.hideBanner();
        return (
          <div key="banner" className={classNames} style={this.props.css}>
            <div style={{ flex: 1 }}>
              {this.renderImage()}
              {this.renderTitle()}
            </div>
            <a className="float-right btn-default btn-sm" onClick={this.close.bind(this)}><i className="fas fa-check"></i></a>
          </div>
        );
      } if (this.props.children) {
        return (
          <div key="banner" className={classNames} style={this.props.css}>
            <div style={{ flex: 1 }}>
            {this.props.children}
            </div>
            <a className="float-right btn-default btn-sm" onClick={this.close.bind(this)}><i className="fas fa-check"></i></a>
          </div>
        );
      }
        return null;
    }
    return null;
  }

  renderTitle() {
    return <div>{this.props.title}</div>;
  }

  timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

Banner.propTypes = {
  title: PropTypes.node,
  css: PropTypes.object,
  visibleTime: PropTypes.number,
  image: PropTypes.string,
  imageClass: PropTypes.string,
  transitionAppearTime: PropTypes.number,
  transitionTime: PropTypes.number,
  showBanner: PropTypes.bool,
  setShowBanner: PropTypes.func,
  children: PropTypes.node,
};

export default Banner;
