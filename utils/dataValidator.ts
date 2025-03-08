/**
 * Utility for validating data integrity and structure
 */
export const dataValidator = {
  /**
   * Validate that an object has the expected structure
   */
  validateObjectStructure: (obj: any, requiredFields: string[]) => {
    if (!obj || typeof obj !== 'object') {
      return {
        valid: false,
        missing: requiredFields,
        message: 'Not a valid object'
      };
    }
    
    const missing = requiredFields.filter(field => {
      const fieldParts = field.split('.');
      let current = obj;
      
      for (const part of fieldParts) {
        if (current === undefined || current === null) {
          return true;
        }
        current = current[part];
      }
      
      return current === undefined || current === null;
    });
    
    return {
      valid: missing.length === 0,
      missing,
      message: missing.length > 0 
        ? `Missing required fields: ${missing.join(', ')}` 
        : 'Valid object structure'
    };
  },
  
  /**
   * Validate an array of objects
   */
  validateArrayStructure: (arr: any[], requiredFields: string[]) => {
    if (!Array.isArray(arr)) {
      return {
        valid: false,
        message: 'Not a valid array'
      };
    }
    
    if (arr.length === 0) {
      return {
        valid: true,
        message: 'Empty array',
        isEmpty: true
      };
    }
    
    const invalidItems = arr.map((item, index) => {
      const validation = this.validateObjectStructure(item, requiredFields);
      return validation.valid ? null : { index, ...validation };
    }).filter(Boolean);
    
    return {
      valid: invalidItems.length === 0,
      invalidItems,
      message: invalidItems.length > 0
        ? `${invalidItems.length} items have invalid structure`
        : 'All items have valid structure'
    };
  },
  
  /**
   * Validate date strings in an object
   */
  validateDates: (obj: any, dateFields: string[]) => {
    if (!obj || typeof obj !== 'object') {
      return {
        valid: false,
        message: 'Not a valid object'
      };
    }
    
    const invalidDates = dateFields.filter(field => {
      const value = obj[field];
      if (!value) return false; // Skip if not present
      
      // Try to parse the date
      const date = new Date(value);
      return isNaN(date.getTime());
    });
    
    return {
      valid: invalidDates.length === 0,
      invalidDates,
      message: invalidDates.length > 0
        ? `Invalid date fields: ${invalidDates.join(', ')}`
        : 'All date fields are valid'
    };
  },
  
  /**
   * Validate relationships between objects
   */
  validateRelationships: (obj: any, relationships: {field: string, relatedObj: any, relatedField: string}[]) => {
    if (!obj || typeof obj !== 'object') {
      return {
        valid: false,
        message: 'Not a valid object'
      };
    }
    
    const invalidRelationships = relationships.filter(rel => {
      const fieldValue = obj[rel.field];
      if (!fieldValue) return false; // Skip if not present
      
      if (!rel.relatedObj) return true; // Invalid if related object doesn't exist
      
      const relatedValue = rel.relatedObj[rel.relatedField];
      return fieldValue !== relatedValue;
    });
    
    return {
      valid: invalidRelationships.length === 0,
      invalidRelationships,
      message: invalidRelationships.length > 0
        ? `Invalid relationships: ${invalidRelationships.map(r => r.field).join(', ')}`
        : 'All relationships are valid'
    };
  },
  
  /**
   * Validate a complete data set
   */
  validateDataSet: (data: any, schema: any) => {
    const results = {};
    
    // Validate overall structure
    if (schema.type === 'object') {
      results['structure'] = this.validateObjectStructure(
        data, 
        schema.requiredFields || []
      );
    } else if (schema.type === 'array') {
      results['structure'] = this.validateArrayStructure(
        data,
        schema.itemRequiredFields || []
      );
    }
    
    // Validate dates if specified
    if (schema.dateFields && schema.dateFields.length > 0) {
      if (schema.type === 'object') {
        results['dates'] = this.validateDates(data, schema.dateFields);
      } else if (schema.type === 'array' && data.length > 0) {
        // Check dates in the first item as a sample
        results['dates'] = this.validateDates(data[0], schema.dateFields);
      }
    }
    
    // Validate relationships if specified
    if (schema.relationships && schema.relationships.length > 0) {
      if (schema.type === 'object') {
        results['relationships'] = this.validateRelationships(
          data, 
          schema.relationships
        );
      }
    }
    
    // Overall validity
    const isValid = Object.values(results).every(r => r.valid);
    
    return {
      valid: isValid,
      details: results,
      message: isValid 
        ? 'Data validation passed' 
        : 'Data validation failed'
    };
  },
  
  /**
   * Get schema for common data types in the app
   */
  getSchema: (type: string) => {
    const schemas = {
      user: {
        type: 'object',
        requiredFields: ['id', 'email', 'name'],
        dateFields: ['created_at']
      },
      household: {
        type: 'object',
        requiredFields: ['id', 'name', 'slug', 'invite_code'],
        dateFields: ['created_at']
      },
      chore: {
        type: 'object',
        requiredFields: ['id', 'household', 'name', 'slug'],
        dateFields: ['created_at']
      },
      assignment: {
        type: 'object',
        requiredFields: ['id', 'chore', 'assigned_to', 'due_date', 'status', 'title'],
        dateFields: ['assigned_date', 'due_date', 'created_at']
      },
      users: {
        type: 'array',
        itemRequiredFields: ['id', 'email', 'name']
      },
      assignments: {
        type: 'array',
        itemRequiredFields: ['id', 'title', 'status']
      }
    };
    
    return schemas[type] || null;
  }
};

export default dataValidator;
