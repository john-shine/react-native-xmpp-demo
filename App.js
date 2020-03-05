import React from 'react';
import { Provider } from 'mobx-react';
import Chat from './src/screens/chat';
import { RootStore } from './src/stores/RootStore';
const store = RootStore.create({});

export default class App extends React.Component{
  render(){
    return(
      <Provider rootStore={store}>
        <Chat />
      </Provider>
    )
  }
}
