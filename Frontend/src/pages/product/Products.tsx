import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackagePlus, Package, Edit } from "lucide-react";
import { useState } from "react";
import { getImageUrl } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductFormModal from "@/components/Forms/product/ProductFormModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DeleteEntityModal from "@/components/Forms/common/DeleteEntityModal";
import { productService } from "@/services/productservice";

const Products = () => {
  const {
    products,
    pagination,
    isLoading,
    isFetching,
    error,
    refetch,
    resetFilters,
    handlePageChange,
    handleLimitChange,
    handleSearch,
    handleSort,
    sort,
    order,
    search,
    limit,
  } = useProducts();

  const [searchInput, setSearchInput] = useState(search);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>Products List</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <input
                type="text"
                value={searchInput}
                placeholder="Search products..."
                className="px-3 py-2 border rounded-md"
                onChange={(e) => { setSearchInput(e.target.value); handleSearch(e.target.value) }}
              />
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
              <ProductFormModal
                triggerMessage={
                  <Button variant="outline">
                    <PackagePlus className="mr-2" />
                    Add Product
                  </Button>
                }
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {pagination && `Total: ${pagination.total} products`}
            </div>
            <Select
              value={String(limit)}
              onValueChange={(value) => handleLimitChange(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
              </div>
            )}
            <Table>
              <TableHeader className="text-xl">
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('reference')}
                  >
                    Ref {sort === 'reference' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    Name {sort === 'name' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('category')}
                  >
                    Category {sort === 'category' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity {sort === 'quantity' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('price')}
                  >
                    Price {sort === 'price' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="text-lg">
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 " />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow className="text-lg">
                    <TableCell colSpan={6}>Error: {error.message}</TableCell>
                  </TableRow>
                ) : products && products?.length > 0 ?
                  (
                    products.map((product) => (
                      <TableRow className="text-lg" key={product._id}>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="rounded-lg size-20">
                            <AvatarImage src={product.image ? getImageUrl(product.image) : `https://ui-avatars.com/api/?name=${product.name}`} />
                            <AvatarFallback className="text-xs text-wrap text-center">{product.name}</AvatarFallback>
                          </Avatar>
                          {product.reference}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{product.price} TND</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-4">
                            <ProductFormModal
                              triggerMessage={
                                <Button variant={"outline"} size={"icon"}>
                                  <Edit className="text-green-700" />
                                </Button>
                              }
                              product={product}
                            />
                            <DeleteEntityModal
                              entity={product}
                              entityName={product.name}
                              entityType="Product"
                              deleteFunction={productService.deleteProduct}
                              queryKeys={[["products"]]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) :
                  (
                    <TableRow className="text-lg">
                      <TableCell colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <Package size={48} className="mb-2 opacity-50" />
                          <p className="text-lg font-medium">No Products Found</p>
                          <p className="text-sm">Start by adding a new product or try a different search</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }
              </TableBody>
            </Table>

            {pagination && pagination.pages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={pagination.page === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
