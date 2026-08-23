import { Router } from 'express';
import { getAllLanguages, getLanguage } from '../execution/languageRegistry.js';

const router = Router();

router.get('/', (req, res) => {
  const languages = getAllLanguages().map(({ id, name, extension, monacoLang, type, defaultCode }) => ({
    id, name, extension, monacoLang, type, defaultCode
  }));
  res.json({ languages });
});

router.get('/:id', (req, res) => {
  const lang = getLanguage(req.params.id);
  if (!lang) {
    return res.status(404).json({ error: 'Language not found' });
  }
  const { id, name, extension, monacoLang, type, defaultCode } = lang;
  res.json({ language: { id, name, extension, monacoLang, type, defaultCode } });
});

export default router;
