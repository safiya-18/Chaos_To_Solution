import { Router } from 'express';
import weatherMock from '../data/mock/weather.json' with { type: 'json' };
import productsMock from '../data/mock/products.json' with { type: 'json' };
import countriesMock from '../data/mock/countries.json' with { type: 'json' };
import booksMock from '../data/mock/books.json' with { type: 'json' };
import quotesMock from '../data/mock/quotes.json' with { type: 'json' };
import campusMapMock from '../data/local/campus_map.json' with { type: 'json' };
import wasteTaxonomyMock from '../data/local/waste_taxonomy.json' with { type: 'json' };
import nutritionMock from '../data/local/nutrition.json' with { type: 'json' };

const router = Router();

const mockRegistry = {
  weather: weatherMock,
  products: productsMock,
  countries: countriesMock,
  books: booksMock,
  quotes: quotesMock,
  'campus-map': campusMapMock,
  'waste-taxonomy': wasteTaxonomyMock,
  nutrition: nutritionMock
};

router.get('/:dataset', (req, res) => {
  const { dataset } = req.params;
  const data = mockRegistry[dataset.toLowerCase()];

  if (!data) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'MOCK_NOT_FOUND',
        message: `Mock dataset '${dataset}' not found. Available datasets: ${Object.keys(mockRegistry).join(', ')}`
      }
    });
  }

  return res.status(200).json({
    success: true,
    data
  });
});

export default router;
