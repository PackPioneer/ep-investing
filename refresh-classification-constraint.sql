-- Refreshes the news_articles.classification check constraint to include
-- raising_intent (and every classification the current pipeline emits).
-- The original migration only allowed 8 values; the Phase-8 values were added
-- directly in the dashboard, so this rebuilds the constraint to the full set.
-- Safe to run repeatedly.

alter table news_articles drop constraint if exists news_articles_classification_check;

alter table news_articles add constraint news_articles_classification_check
  check (classification in (
    'funding',
    'raising_intent',
    'fund_close',
    'ipo',
    'earnings',
    'leadership_change',
    'policy',
    'm_and_a',
    'product',
    'regulatory',
    'market',
    'partnership',
    'other'
  ) or classification is null);
