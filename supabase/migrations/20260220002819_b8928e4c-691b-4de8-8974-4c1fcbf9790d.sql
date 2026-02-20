-- Attach the existing trigger function to stock_movements table
CREATE TRIGGER update_product_stock_trigger
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock();