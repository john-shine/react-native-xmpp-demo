import {types, getSnapshot} from 'mobx-state-tree';
import {ChatStore} from './ChatStore';

export const RootStore = types
  .model('RootStore', {
    identifier: types.optional(types.identifier, 'RootStore'),
    chatStore: types.optional(ChatStore, {})
  })
  .actions(self => ({
    async save() {
      try {
        const transformedSnapshot = getSnapshot(self);
        return transformedSnapshot;
      } catch (err) {
        console.warn('unexpected error: ', err);
      }
    },
  }));
