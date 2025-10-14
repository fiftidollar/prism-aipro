-- Create personas table
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own personas" 
ON public.personas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personas" 
ON public.personas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas" 
ON public.personas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas" 
ON public.personas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_personas_updated_at
BEFORE UPDATE ON public.personas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();