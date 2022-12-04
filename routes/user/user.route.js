import express from 'express';
import { requireSignIn, requireAuth } from '../../services/passport';
import UserController from '../../controllers/user/user.controller';
import { multerSaveTo } from '../../services/multer-service';
import Logger from "../../services/logger";
const logger = new Logger('login')
const router = express.Router();

//login with phone and password
router.post('/signin',(req, res , next) => {
    logger.info(`${req.ip} || try to login`);
    next();
},requireSignIn, UserController.signIn);
router.route('/signUp')
    .post(
        multerSaveTo('files').fields([
            { name: 'img', maxCount: 1, options: false },
            { name: 'carLicense', maxCount: 4, options: false },
            { name: 'driverLicense', maxCount: 4, options: false },
        ]),
        UserController.validateSignUpBody(),
        UserController.signUp
    );
router.route('/addUser')
    .post(
        requireAuth,
        multerSaveTo('files').fields([
            { name: 'img', maxCount: 1, options: false },
            { name: 'carLicense', maxCount: 4, options: false },
            { name: 'driverLicense', maxCount: 4, options: false },
        ]),
        UserController.validateSignUpBody(),
        UserController.addUser
    );

//get all 
router.route('/getAll')
    .get(requireAuth,UserController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth,UserController.getAll);
router.route('/:id/findById')
    .get(requireAuth,UserController.findById);
router.route('/:userId/delete')
    .delete(requireAuth,UserController.delete);

router.route('/:userId/block')
    .put(
        requireAuth,
        UserController.block
    );
router.route('/:userId/unblock')
    .put(
        requireAuth,
        UserController.unblock
    );

router.route('/:userId/verify')
    .put(
        requireAuth,
        UserController.verify
    );
router.route('/:userId/unVerify')
    .put(
        requireAuth,
        UserController.unVerify
    );

router.route('/logout')
    .post(
        requireAuth,
        UserController.logout
    );

router.route('/updateToken')
    .put(
        requireAuth,
        UserController.updateToken
    );
//update profile
router.put('/user/:userId/updateInfo',
    requireAuth,
    multerSaveTo('files').fields([
        { name: 'img', maxCount: 1, options: false },
        { name: 'carLicense', maxCount: 4, options: false },
        { name: 'driverLicense', maxCount: 4, options: false },
    ]),
    UserController.validateUpdatedUser(true),
    UserController.updateUser);
//update password
router.put('/user/updatePassword',
    requireAuth,
    UserController.validateUpdatedPassword(),
    UserController.updatePassword);
//send verify code


router.post('/sendCode-phone',
    UserController.validateForgetPassword(),
    UserController.forgetPasswordSms);

router.post('/confirm-code-phone',
    UserController.validateConfirmVerifyCodePhone(),
    UserController.resetPasswordConfirmVerifyCodePhone);

router.post('/reset-password-phone',
    UserController.validateResetPasswordPhone(),
    UserController.resetPasswordPhone);

router.route('/addAddress')
    .post(
        requireAuth,
        UserController.validateAddressBody(),
        UserController.addAddress
    );
router.route('/getAllAddresses')
    .get(requireAuth,UserController.findAddresses);
router.route('/:addressId/deleteAddress')
    .delete(requireAuth,UserController.deleteAddress);
export default router;
