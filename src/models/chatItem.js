import {types} from 'mobx-state-tree';


export const ChatItem = types
  .model({
    id: types.string,
    text: types.string,
    status: types.integer,
    is_send: types.boolean,
    datetime: types.string
  });
