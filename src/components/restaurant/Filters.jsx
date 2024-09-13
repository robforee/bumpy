import React from 'react';

export default function Filters({ filters, setFilters }) {
    const handleCategoryChange = (category) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            category: prevFilters.category === category ? '' : category
        }));
    };

    const handleSortChange = (sortDirection) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            sortDirection: prevFilters.sortDirection === sortDirection ? '' : sortDirection
        }));
    };

    return (
        <section className="filter">
            <div className="filter-buttons">
                <button 
                    onClick={() => handleCategoryChange('People')}
                    className={filters.category === 'People' ? 'active' : ''}
                >
                    People
                </button>
                <button 
                    onClick={() => handleCategoryChange('Projects')}
                    className={filters.category === 'Projects' ? 'active' : ''}
                >
                    Projects
                </button>
                <button 
                    onClick={() => handleSortChange('asc')}
                    className={filters.sortDirection === 'asc' ? 'active' : ''}
                >
                    Asc
                </button>
                <button 
                    onClick={() => handleSortChange('desc')}
                    className={filters.sortDirection === 'desc' ? 'active' : ''}
                >
                    Desc
                </button>
            </div>
        </section>
    );
}