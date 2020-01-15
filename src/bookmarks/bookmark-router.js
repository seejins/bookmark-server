const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')
const BookmarksService = require('./bookmarks-service')


const bookmarkRouter = express.Router()
const bodyParser = express.json()

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks)
            })
            .catch(next)
    })
    .post(bodyParser, (req, res) => {
        const { title, url, description, rating } = req.body

        if (!title) {
            logger.error(`Title is required`)
            return res
                .status(400)
                .send('Title is required')
        }

        if (!url) {
            logger.error('URL is required')
            return res
                .status(400)
                .send('URL is required')
        }

        if (!description) {
            logger.error('description is required')
            return res
                .status(400)
                .send('Description is required')
        }

        if (!rating) {
            logger.error('rating is required')
            return res
                .status(400)
                .send('Rating is required')
        }

        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res
                .status(400)
                .send('Rating must be a number between 0 and 5')
        }

        const id = uuid()

        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        }

        bookmarks.push(bookmark)

        logger.info(`Bookmark with id ${id} created`)

        res
            .status(201)
            .location(`http://localhost:8000/card/${id}`)
            .json(bookmark)

    })

bookmarkRouter
    .route('/bookmarks/:bookmark_id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                if(!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.json(bookmark)
            })
            .catch(next)
    })

    .delete((req, res) => {
        const { id } = req.params

        const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id)

        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`)
            return res
                .status(404)
                .send('Not found')
        }

        bookmarks.filter(bm => bm.id == id)

        bookmarks.splice(bookmarkIndex, 1)

        logger.info(`Bookmark with id ${id} deleted`)

        res
            .status(204)
            .end()
    })

module.exports = bookmarkRouter