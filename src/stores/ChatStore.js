import {flow, types} from 'mobx-state-tree';
import {ChatItem} from '../models/chatItem';

export const ChatStore = types
  .model({
    loading: false,
    msgLists: types.optional(types.array(ChatItem), []),
  })
  .actions(self => {
    const updateMsg = message => {
      self.msgLists.push(message);
    };

    return {
      updateMsg
    };
  });
