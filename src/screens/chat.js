import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  Clipboard,
  ToastAndroid,
  AppState
} from 'react-native';
import styles from '../style';
import XMPP from "react-native-xmpp";
import {inject, observer} from "mobx-react";
import {formatDateDay} from '../utils/common';
import {sqLiteManager} from '../utils/SQLite';
import NetInfo from "@react-native-community/netinfo";
import {server, port, domain, userAccount, userPasswd, chatWithUserAccount} from '../../config';


class Chat extends React.Component {

  STATUS_FAILURE = -1;
  STATUS_SENT = 1;
  STATUS_ACCEPTED = 2;

  ALL_STATUS = [this.STATUS_FAILURE, this.STATUS_SENT, this.STATUS_ACCEPTED];

  constructor(props) {
    super(props);

    this.logged = false;
    this.isLogging = false;
    this.xmppLoginTime = 3000; // how long to try again when fail
    this.xmppLoginTimeoutId = null;

    XMPP.on('connected', this.onConnected);
    XMPP.on('disconnected', this.onDisconnected);
    XMPP.on('authenticated', this.onLogin);
    XMPP.on('messageReceived', this.onReceiveMessaged);

    XMPP.trustHosts([server]);

    this.refFlatList = React.createRef();
    this.state = {
      userInput: '',
      connectError: null
    };
    this.isForegroundState = false;

    this.sqlite = new sqLiteManager();
  }

  componentDidMount() {
    let that = this;
    this.sqlite.openDB().then( dbInstance => {
      that.sqlite.dbInstance = dbInstance;
      that.sqlite.createChatTable().then(() => {
        console.log('create chat table success');
      }).catch(err => {
        throw new Error('create chat table error: ', err);
      });

      that.sqlite.queryChats(userAccount, chatWithUserAccount, 10).then( rows => {
        console.log('query chat history success: ', rows);
        // update chat history props
      }).catch(err => {
        console.warn('query chat history error: ', err);
      });

      // login xmpp server
      that.xmppLogin();
    }).catch(err => {
      console.warn('open DB failure: ', err);
    });

    // listen for network status
    NetInfo.addEventListener(state => this.listenerNetInfo(state));

    // listen for app go background
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillUnmount() {
    this.sqlite.closeDB();
    XMPP.disconnect();
    XMPP.removeListeners();
  }

  getUserNameFromId = (userId) => {
    return userId + '@' + domain;
  };

  getUserIdFromName = (userName) => {
    if (String(userName).indexOf('@') >= 0) {
      return String(userName).split('@')[0];
    } else {
      return null;
    }
  };

  listenerNetInfo = (state) => {
    if(!state.isConnected){
      this.setState({
        connectError: 'network connect error, please check your network status'
      })
    }
  };

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('App has come to the front!');
      this.isForegroundState = false;
    } else {
      console.log('App has come to the foreground!');
      this.isForegroundState = true;
    }
  };

  // login xmpp server
  xmppLogin = () => {
    let user = this.getUserNameFromId(userAccount);
    if (this.logged) {
      console.log('Already logined.');
      return;
    }

    if (this.isLogging) {
      console.log('xmpp is loging.');
      return;
    }

    this.isLogging = true;
    console.info('try login with user: ', user, ' password: ', userPasswd, ' to server ', server, ':', port);
    XMPP.connect(
      userAccount,
      userPasswd,
      XMPP.PLAIN,
      server,
      port,
    ).then(() => {
      this.isLogging = false;
      console.log('login success');
      this.xmppLoginTimeoutId && clearTimeout(this.xmppLoginTimeoutId);
      this.setState({
        connectError: null
      });
    }).catch(err => {
      console.log('login failure:', err, '. try again after ', this.xmppLoginTime);
      this.isLogging = false;
      this.xmppLoginTimeoutId = setTimeout(() => {
        this.xmppLogin();
      }, this.xmppLoginTime);
      this.setState({
        connectError: 'login failure, try again...'
      });
    });
  };

  onConnected = () => {
    console.log('xmpp Connected');
    this.logged = true;
    this.xmppLoginTimeoutId && clearTimeout(this.xmppLoginTimeoutId);
    this.setState({
      connectError: null
    });
  };

  onDisconnected = (message) => {
    console.log('xmpp disconnected: ', message, '. try again after ', this.xmppLoginTime);
    this.logged = false;
    this.xmppLoginTimeoutId = setTimeout(() => {
      this.xmppLogin();
    }, this.xmppLoginTime);
    this.setState({
      connectError: 'connection lost'
    });
  };

  onLogin = () => {
    console.log('xmpp login success!');
    this.logged = true;
    this.xmppLoginTimeoutId && clearTimeout(this.xmppLoginTimeoutId);
    this.setState({
      connectError: null
    });
  };

  bindUserInput = (value) => {
    this.setState({
      userInput: value,
    });
  };

  inputOnFocus = () => {
    if (this.refFlatList && this.refFlatList.current) {
      this.refFlatList.current.scrollToEnd();
    }
  };

  getPropsMessageItem = (messageId, text, isSend, status) => {
    return {
      id: messageId,
      text: text,
      status: status,
      is_send: isSend,
      datetime: formatDateDay(new Date())
    }
  };

  // send chat message
  sendMessage = async () => {
    let that = this;
    const {userInput} = this.state;
    const messageText = userInput.trim();
    console.log('messageText', messageText);
    if (!messageText) {
      return false;
    }

    const messageId = await XMPP.requestMessageid().catch(err => {
        console.warn("get xmpp message Id error: ", err);
    });

    if (!messageId) {
      return false;
    }

    let messageItem, chatRow;
    // send to XMPP server with previous id
    XMPP.sendMessageUpdated(messageText, this.getUserNameFromId(chatWithUserAccount), messageId).then(() => {
      try {
        chatRow = this.sqlite.getChatItem(messageId, messageText, userAccount, chatWithUserAccount, true, this.STATUS_SENT);

        this.sqlite.insertChatItem(chatRow).then((tx, results) => {
          console.log('insert chat row success', tx, results);
        }).catch(err => {
          console.warn('insert chat row failure', err);
        });
      } catch (err) {
        console.warn('insert chat row failure', err);
      }

      console.log('message send success: ', messageId);
      messageItem = this.getPropsMessageItem(messageId, messageText, true, this.STATUS_SENT);
      this.props.chatStore.updateMsg(messageItem).then(() => {
        setTimeout(() => {
          if (that.refFlatList && that.refFlatList.current) {
            that.refFlatList.current.scrollToEnd();
          }
        }, 500);
      });
    }).catch(err => {
      try {
        chatRow = this.sqlite.getChatItem(messageId, messageText, userAccount, chatWithUserAccount, true, this.STATUS_FAILURE);

        this.sqlite.insertChatItem(chatRow).then((tx, results) => {
          console.log('insert chat row success', tx, results);
        }).catch(err => {
          console.warn('insert chat row failure', err);
        });
      } catch (err) {
        console.warn('insert chat row failure', err);
      }

      console.log('message send failure: ', messageId, err);
      messageItem = this.getPropsMessageItem(messageId, messageText, true, this.STATUS_FAILURE);
      this.props.chatStore.updateMsg(messageItem).then(() => {
        setTimeout(() => {
          if (that.refFlatList && that.refFlatList.current) {
            that.refFlatList.current.scrollToEnd();
          }
        }, 500);
      });

    });

    this.setState({
      userInput: ''
    });

  };

  onReceiveMessaged = message => {
    console.log('message received: ', message);
    const {'from': fromUserName, 'body': messageText, '_id': messageId} = message;

    if (!fromUserName || !messageText || !messageId) {
      console.warn('empty from or message: ', fromUserName, messageText, messageId);
      return;
    }

    try {
      const chatRow = this.sqlite.getChatItem(messageId, messageText, domain, userAccount, chatWithUserAccount, false, this.STATUS_ACCEPTED);

      this.sqlite.insertChatItem(chatRow).then((tx, results) => {
        console.log('insert chat row success', tx, results);
      }).catch(err => {
        console.error('insert chat row failure', err);
      });
    } catch (err) {
      console.error('insert chat row failure', err);
    }

    const msgItem = this.getPropsMessageItem(messageId, messageText, false, message.time);

    if (String(this.getUserIdFromName(fromUserName)) !== String(chatWithUserAccount)) {
      console.log('not current session message');
      return;
    }

    let that = this;
    const messageItem = this.getPropsMessageItem(messageId, messageText, true, this.STATUS_ACCEPTED);
    this.props.chatStore.updateMsg(messageItem).then(() => {
      setTimeout(() => {
        // scroll to latest message
        if (that.refFlatList && that.refFlatList.current) {
          that.refFlatList.current.scrollToEnd();
        }
      }, 500);
    });
  };

  copyToBoard = text => {
    Clipboard.setString(text);
    ToastAndroid.showWithGravity(
      "copied to clipboard",
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
  };

  renderRow = item => {
    const userAvatar = require('../resources/images/avatar.jpg');
    const chatWithUserAvatar = require('../resources/images/chatWithAvatar.jpg');

    return (
      <View style={styles.rowList}>
        <View
          style={[
            styles.flex_row,
            !item.is_send ? styles.left_box : styles.right_box,
          ]}>

          {!item.is_send ? (
            <Image
              style={[styles.chatAvatar, {marginRight: 10, marginLeft: 10}]}
              source={chatWithUserAvatar}
            />
          ) : []}

          <TouchableOpacity
            style={!item.is_send ? styles.flex_left : styles.flex_right}
            onPress={() => this.copyToBoard(item)}
          >
            {
              item.image ?
              <Image
                style={{width: 100, height: 100}}
                source={{uri: item.text}}
              />
              :
              <Text
                style={[
                  styles.messageText,
                  !item.is_send ? styles.receiveBoxBg : styles.sendBoxBg,
                ]}>
                {item.text}
              </Text>
            }
          </TouchableOpacity>
          {item.is_send ?
            <Image
              style={[styles.chatAvatar, {marginRight: 10, marginLeft: 10}]}
              source={userAvatar}
            />
          : []}
        </View>
        <Text style={styles.sendTime}>{item.datetime}</Text>
      </View>
    );
  };

  render() {
    const {msgLists} = this.props.chatStore;
    const {userInput, connectError} = this.state;
    const userAvatar = require('../resources/images/avatar.jpg');
    console.log('connectError', connectError, typeof connectError);

    return (
      <View style={styles.content}>
        <View style={styles.headerBox}>
          <View style={[styles.rowLayout, styles.padding5]}>
            <View style={styles.row}>
              <Image style={styles.userAvatar} source={userAvatar} />
              <Text style={{textAlign: "center", flex: 1, height: 40, alignSelf: 'center'}}>John Shine</Text>
            </View>
          </View>
          <View style={{backgroundColor: '#ddd', height: 1}} />
        </View>


        {
          connectError ?
          <View style={styles.connectInfoText}>
            <Text>{connectError}</Text>
          </View>
          :
          []
        }

        <View style={styles.chatContent}>
          <FlatList
            ref={this.refFlatList}
            data={msgLists.slice()}
            renderItem={({item}) => this.renderRow(item)}
          />
        </View>

        <View style={[styles.chatInputBox, styles.rowLayout]}>
          <View style={styles.textInputBox}>
            <TextInput
              placeholder="input something..."
              onChangeText={text => this.bindUserInput(text)}
              value={userInput}
              style={styles.userInput}
              onFocus={this.inputOnFocus}
            />
          </View>
          <TouchableOpacity onPress={this.sendMessage} style={styles.sendBtn}>
            <Text>SEND</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default inject(
  ({rootStore: {chatStore}}) => ({
    chatStore,
  }),
)(observer(Chat));
