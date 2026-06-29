import { body, query } from 'express-validator';

export const createPostValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 5000 })
    .withMessage('Post content exceeds maximum length'),

  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE', 'FRIENDS'])
    .withMessage('Invalid visibility option'),

  body('media_urls')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array'),

  body('media_types')
    .optional()
    .isArray()
    .withMessage('Media types must be an array'),
];

export const updatePostValidator = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Post content must be between 1 and 5000 characters'),

  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE', 'FRIENDS'])
    .withMessage('Invalid visibility option'),
];

export const createCommentValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment content exceeds maximum length'),

  body('parent_comment_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent comment ID'),
];

export const paginationValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
];

export const searchValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
];

export default {
  createPostValidator,
  updatePostValidator,
  createCommentValidator,
  paginationValidator,
  searchValidator,
};