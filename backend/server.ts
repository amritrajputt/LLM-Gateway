import express from 'express'
import { clerkMiddleware } from '@clerk/express'
import {cors} from 'cors';
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: 'http://localhost:3000',
}))
const PORT = 3000

app.use(clerkMiddleware())

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})