import {types} from 'mobx-state-tree';
import {ChatItem} from '../models/chatItem';

export const ChatStore = types
  .model({
    loading: false,
    msgLists: types.optional(types.array(ChatItem), []),
  })
  .actions(self => {
    const updateItem = message => {
      self.msgLists.push(message);
    };

    const initHistory = histories => {
      self.msgLists = Object.assign([], histories);
    }

    return {
      updateItem,
      initHistory
    };
  });
