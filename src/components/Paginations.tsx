"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type PaginationProps = {
  totalCount: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

const Paginations = ({
  totalCount,
  currentPage: initialPage,
  totalPages: propsTotalPages,
  onPageChange,
}: PaginationProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pageCount, setPageCount] = useState(initialPage || 1);
  const [endIndx, setEndIndx] = useState(3);
  const [startIndx, setStartIndx] = useState(0);
  const pageNumber = propsTotalPages || Math.ceil(totalCount / 20);
  const pageBtns = 3;
  const pages = [];

  for (let i = 1; i <= pageNumber; i++) {
    pages.push(i);
  }

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > pageNumber) return;
    setPageCount(newPage);
    onPageChange?.(newPage); // ✅ informe le parent

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  const handlePageCount = (countBy: number) => {
    changePage(pageCount + countBy);
  };

  useEffect(() => {
    const currentPage = Number(searchParams.get("page"));
    setPageCount(currentPage || initialPage || 1);

    if (currentPage) {
      if (currentPage >= pageBtns) {
        setEndIndx(currentPage + 1);
      } else {
        setEndIndx(pageBtns);
      }
      setStartIndx(currentPage - 1);
    }
  }, [searchParams, initialPage]);

  return (
    pageNumber > 1 && (
      <Pagination className="mt-10">
        <PaginationContent className="flex-wrap">
          <PaginationItem
            onClick={() => handlePageCount(-1)}
            className={`cursor-pointer ${
              1 >= pageCount ? "opacity-65 cursor-not-allowed" : ""
            }`}
          >
            <PaginationPrevious title="Prev" />
          </PaginationItem>
          {pageBtns <= pageCount && pageBtns < pages.length && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {pages.slice(startIndx, endIndx).map((num) => (
            <PaginationItem key={num}>
              <PaginationLink
                isActive={num === pageCount}
                onClick={() => changePage(num)} 
                className="cursor-pointer select-none"
              >
                {num}
              </PaginationLink>
            </PaginationItem>
          ))}
          {pages.length > pageBtns &&
            pages.length - 1 !== pageCount &&
            pages.length - 1 > pageCount && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          <PaginationItem
            title="Next"
            onClick={() => handlePageCount(1)}
            className={`cursor-pointer ${
              pages.length === pageCount ? "opacity-65 cursor-not-allowed" : ""
            }`}
          >
            <PaginationNext />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  );
};

export default Paginations;
