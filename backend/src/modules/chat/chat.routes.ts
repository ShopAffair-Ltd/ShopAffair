import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  getOrCreateDirectChat,
  createGroup,
  createCommunity,
  getUserChats,
  getChatRoom,
  sendMessage,
  postTrade,
  markMessagesAsRead,
  togglePinChat,
  clearChat,
  addParticipant,
  removeParticipant,
  blockUser,
  unblockUser,
  getBlockedUsers,
  createInvite,
  useInvite
} from './chat.controller.js';
import { discover, join, leave, promote, updateSettings, myAdminGroups } from './chat.communities.controller.js';

const router = Router();

// TEMP DEBUG — remove once the /conversations caller is identified
router.use('/conversations', (req, res, next) => {
  console.log('CALLER →', {
    method: req.method,
    path: req.originalUrl,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer,
    ip: req.ip
  });
  next();
});

router.use(requireAuth);

router.get('/', getUserChats);
router.get('/blocked', getBlockedUsers);
router.get('/communities/discover', discover);
router.get('/communities/my-admin-groups', myAdminGroups);
router.get('/:chatRoomId', getChatRoom);

router.post('/direct/:userId', getOrCreateDirectChat);
router.post('/group', createGroup);
router.post('/community', createCommunity);
router.post('/:chatRoomId/messages', sendMessage);
router.post('/:chatRoomId/trades', postTrade);
router.post('/:chatRoomId/read', markMessagesAsRead);
router.post('/:chatRoomId/pin', togglePinChat);
router.post('/:chatRoomId/clear', clearChat);
router.post('/:chatRoomId/participants', addParticipant);
router.post('/:chatRoomId/invite', createInvite);
router.post('/invite/:code/use', useInvite);
router.post('/:chatRoomId/join', join);
router.post('/:chatRoomId/leave', leave);
router.post('/:chatRoomId/promote/:userId', promote);
router.patch('/:chatRoomId/settings', updateSettings);

router.delete('/:chatRoomId/participants/:userId', removeParticipant);

router.post('/block/:userId', blockUser);
router.delete('/block/:userId', unblockUser);

export default router;