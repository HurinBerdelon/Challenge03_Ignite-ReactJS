import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
	children: ReactNode;
}

interface UpdateProductAmount {
	productId: number;
	amount: number;
}

interface CartContextData {
	cart: Product[];
	addProduct: (productId: number) => Promise<void>;
	removeProduct: (productId: number) => void;
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(() => {
		const storagedCart = localStorage.getItem('@RocketShoes:cart')

		if (storagedCart) {
			return JSON.parse(storagedCart);
		}

		return [];
	});

	const addProduct = async (productId: number) => {
		try {
			const updatedCart = [...cart]

			const productInCart = updatedCart.find(product => product.id === productId)

			const response = await api.get(`stock/${productId}`)

			const productInStock: Stock = response.data

			const currentAmount = productInCart ? productInCart.amount : 0

			if (productInStock.amount < currentAmount + 1) {
				toast.error('Quantidade solicitada fora de estoque')
				return
			}

			if (productInCart) {
				productInCart.amount += 1
			} else {
				const product = await api.get(`products/${productId}`)

				const newProduct: Product = {
					...product.data,
					amount: 1
				}

				updatedCart.push(newProduct)
			}

			setCart(updatedCart)

			localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

		} catch {
			toast.error('Erro na adição do produto')
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const updatedCart = [...cart]

			const product = updatedCart.find(item => item.id === productId)

			if (!product) {
				toast.error('Erro na remoção do produto')
				return
			}

			updatedCart.splice(updatedCart.indexOf(product), 1)

			setCart(updatedCart)

			localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

		} catch {
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({
		productId,
		amount,
	}: UpdateProductAmount) => {
		try {

			if (amount <= 0) {
				toast.error('Erro na alteração de quantidade do produto')
				return
			}

			const updatedCart = [...cart]

			const productInCart = updatedCart.find(product => product.id === productId)

			if (!productInCart) {
				toast.error('Erro na alteração de quantidade do produto')
				return
			}

			const response = await api.get(`stock/${productId}`)

			const productInStock = response.data

			if (productInStock.amount < amount) {
				toast.error('Quantidade solicitada fora de estoque')
				return
			}

			productInCart.amount = amount

			setCart(updatedCart)

			localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

		} catch {
			toast.error('Erro na alteração de quantidade do produto');
		}
	};

	return (
		<CartContext.Provider
			value={{ cart, addProduct, removeProduct, updateProductAmount }}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart(): CartContextData {
	const context = useContext(CartContext);

	return context;
}
