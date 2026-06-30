-- 1. Modificar la restricción de validación de apuestas en la tabla predictions
-- Esto nos permite guardar predicciones con el formato de ganador y método (ej. 'Local_120', 'Local_Penales')
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_prediction_check;
ALTER TABLE predictions ADD CONSTRAINT predictions_prediction_check CHECK (prediction IN (
  'Local', 'Empate', 'Visitante', 
  'Local_120', 'Local_Penales', 
  'Visitante_120', 'Visitante_Penales'
));

-- 2. Añadir las columnas winner y win_method a la tabla matches
-- Esto nos permite guardar quién ganó oficialmente y por qué método en la base de datos
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner VARCHAR(20) DEFAULT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS win_method VARCHAR(20) DEFAULT NULL;
