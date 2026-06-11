import { Router } from 'express';
import { SearchService } from './search.service';
import { optionalAuth, authenticate } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export function createSearchRouter(searchService: SearchService) {
  const router = Router();

  router.get('/search', optionalAuth, async (req: AuthRequest, res) => {
    const result = await searchService.search({
      q: req.query.q as string || '',
      categoryId: req.query.categoryId as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      brand: req.query.brand as string,
      sort: req.query.sort as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    }, req.user?.id);
    sendSuccess(res, result);
  });

  router.get('/search/suggestions', async (req, res) => {
    const result = await searchService.getSuggestions(req.query.q as string || '');
    sendSuccess(res, result);
  });

  router.get('/search/histories', authenticate, async (req: AuthRequest, res) => {
    const history = await searchService.getSearchHistory(req.user!.id);
    sendSuccess(res, history);
  });

  router.delete('/search/histories', authenticate, async (req: AuthRequest, res) => {
    await searchService.clearSearchHistory(req.user!.id);
    sendSuccess(res, null, 'Search history cleared');
  });

  return router;
}
