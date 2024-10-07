import { getUserProfile, getTopicRoot, getUserInfo  } from '@/src/app/actions/user';

export const userService = {

  // call from within the userService else regret
  async getUserInfo(user) {
    return await getUserInfo();

  },


};