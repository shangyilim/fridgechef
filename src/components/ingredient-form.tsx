
'use client';

import type * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { SuggestRecipesOutput } from '@/ai/flows/suggest-recipes';

const formSchema = z.object({
  ingredients: z
    .string()
    .min(10, {
      message: 'Please list at least a few ingredients.',
    })
    .describe('A comma-separated list of ingredients available in the fridge.'),
});

type IngredientFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  isLoading: boolean;
};

export function IngredientForm({ onSubmit, isLoading }: IngredientFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="ingredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Your Ingredients</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., chicken breast, broccoli, soy sauce, garlic, rice..."
                  className="resize-none min-h-[100px] text-base"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Enter the ingredients you have available, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding Recipes...
            </>
          ) : (
            'Suggest Recipes'
          )}
        </Button>
      </form>
    </Form>
  );
}
