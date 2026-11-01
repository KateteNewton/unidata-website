const express = require('express');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const APP_PACKAGE = process.env.GOOGLE_PLAY_APP_ID || 'com.ryzeinc.UniData';

const fallbackReviews = [
  {
    author: 'Temwani S.',
    role: 'Computer Science, CBU',
    text: 'UniData changed the way I prepare for exams. The quizzes are a lifesaver.',
    rating: 5
  },
  {
    author: 'Gift K.',
    role: 'Computer Science, CBU',
    text: 'Amazing app with exceptional UI. Easy to navigate, past papers and quizzes — education made easy.',
    rating: 5
  },
  {
    author: 'Albert S.',
    role: 'Business, UNZA',
    text: 'UniData Premium is the best K20 I spend every month. An investment in my future.',
    rating: 5
  },
  {
    author: 'Lukundo S.',
    role: 'Computer Engineering, CBU',
    text: 'UniData Quizzes have significantly improved the way I now revise my notes.',
    rating: 5
  }
];

function getAuth() {
  if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher']
      });
    } catch (error) {
      console.error('Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON env value:', error.message);
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
  }

  return null;
}

function normalizeText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean).join(' ');
  if (typeof value === 'object') return normalizeText(value.text || value.value || value.message);
  return String(value).trim();
}

function getReviewRating(review) {
  const candidates = [
    review?.starRating,
    review?.comments?.[0]?.userComment?.starRating,
    review?.comments?.userComment?.starRating,
    review?.userComment?.starRating,
    review?.comments?.[0]?.developerComment?.starRating,
    review?.comments?.[0]?.userComment?.rating,
    review?.comments?.userComment?.rating
  ];

  for (const candidate of candidates) {
    const rating = Number(candidate);
    if (!Number.isNaN(rating)) return rating;
  }

  return 0;
}

function getReviewText(review) {
  const userComment = review?.comments?.[0]?.userComment || review?.comments?.userComment || review?.userComment || {};
  return normalizeText(userComment.text || userComment.comment || userComment.review || review?.comments?.[0]?.comment || review?.comment || '');
}

function formatGoogleReview(review) {
  const author = normalizeText(review?.authorName || review?.userComment?.authorName || 'Verified student');
  const text = getReviewText(review) || 'Great app experience — highly recommended.';
  const rating = getReviewRating(review);

  return {
    author: author || 'Verified student',
    role: 'Google Play review',
    text,
    rating: Math.max(1, Math.min(5, rating || 5))
  };
}

async function fetchPlayReviews() {
  const auth = getAuth();

  if (!auth) {
    return fallbackReviews;
  }

  try {
    const androidpublisher = google.androidpublisher({ version: 'v3', auth });
    const response = await androidpublisher.reviews.list({
      packageName: APP_PACKAGE,
      maxResults: 20
    });

    const reviews = Array.isArray(response?.data?.reviews) ? response.data.reviews : [];
    const positiveReviews = reviews
      .map(formatGoogleReview)
      .filter((review) => review.rating >= 4)
      .slice(0, 6);

    return positiveReviews.length ? positiveReviews : fallbackReviews;
  } catch (error) {
    console.error('Unable to fetch Google Play reviews:', error.message);
    return fallbackReviews;
  }
}

app.get('/api/play-reviews', async (_req, res) => {
  const reviews = await fetchPlayReviews();
  res.json({ reviews });
});

app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  extensions: ['html']
}));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UniData website listening on http://localhost:${PORT}`);
  console.log(`Google Play app ID: ${APP_PACKAGE}`);
});
