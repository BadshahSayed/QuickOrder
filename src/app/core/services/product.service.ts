import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';
import { PRODUCTS } from '../data/products.data';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    constructor() { }

    getProducts(): Observable<Product[]> {
        return of(PRODUCTS);
    }

    getProductById(id: number): Observable<Product | undefined> {
        const product = PRODUCTS.find(p => p.id === id);
        return of(product);
    }
}
