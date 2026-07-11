(function () {
  'use strict';

  // ==========================================================================
  // 1. Algorithm Database (19 Algorithms)
  // ==========================================================================
  const ALGORITHMS = {
    binary_search: {
      name: 'Binary Search',
      category: 'search',
      icon: 'fa-magnifying-glass',
      color: '#3b82f6',
      tagline: 'Logarithmic time search for sorted arrays.',
      description:
        'Divides the sorted search space in half repeatedly. If the target is less than the middle element, it searches the left half; if greater, the right half. Requires random access to elements.',
      complexity: {
        best: 'O(1)',
        avg: 'O(log n)',
        worst: 'O(log n)',
        space: 'O(1)',
      },
      strengths: [
        'Extremely fast: searches 1 million elements in ~20 steps.',
        'Minimal space complexity (O(1) auxiliary space).',
      ],
      weaknesses: [
        'Requires the array to be sorted first.',
        'Requires contiguous array with O(1) index access.',
      ],
      path: 'Search → Sorted → Fast Lookup Required',
      problems: [
        { title: 'Binary Search', link: 'https://leetcode.com/problems/binary-search/' },
        {
          title: 'Search in Rotated Sorted Array',
          link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
        },
      ],
      code: {
        js: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid; // Found target
    }
    if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }
  return -1; // Target not found
}`,
        py: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid # Found target
        elif arr[mid] < target:
            left = mid + 1 # Search right half
        else:
            right = mid - 1 # Search left half
            
    return -1 # Target not found`,
      },
    },

    linear_search: {
      name: 'Linear Search',
      category: 'search',
      icon: 'fa-arrows-left-right',
      color: '#6b7280',
      tagline: 'Sequential scan of elements.',
      description:
        'Checks every element of the collection sequentially from the start to the end until a match is found or the collection is exhausted. Does not require sorted data.',
      complexity: {
        best: 'O(1)',
        avg: 'O(n)',
        worst: 'O(n)',
        space: 'O(1)',
      },
      strengths: [
        'Simple to implement.',
        'Works on unsorted data and linked structures (no index access needed).',
      ],
      weaknesses: ['Slow for large datasets as it examines every element.'],
      path: 'Search → Unsorted → No Extra Memory / Cannot Sort',
      problems: [
        {
          title: 'Find Target Indices After Sorting',
          link: 'https://leetcode.com/problems/find-target-indices-after-sorting-array/',
        },
      ],
      code: {
        js: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Return index of match
    }
  }
  return -1; // Not found
}`,
        py: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i # Return index of match
            
    return -1 # Not found`,
      },
    },

    hash_map: {
      name: 'Hash Map / Set Lookup',
      category: 'search',
      icon: 'fa-hashtag',
      color: '#a855f7',
      tagline: 'Constant-time key lookups using key hash keys.',
      description:
        'Maps keys to values using a hash function. Provides average constant time operations by index-like translation. Requires extra memory to store the hashes and data buckets.',
      complexity: {
        best: 'O(1)',
        avg: 'O(1)',
        worst: 'O(n)',
        space: 'O(n)',
      },
      strengths: [
        'Average constant time lookup, insert, and delete.',
        'Perfect for frequency calculations and fast key-value lookups.',
      ],
      weaknesses: [
        'Requires extra O(n) memory.',
        'Worst-case O(n) on rare hash collisions.',
        'Does not maintain order of keys.',
      ],
      path: 'Search → Unsorted → Extra Memory Available',
      problems: [
        { title: 'Two Sum', link: 'https://leetcode.com/problems/two-sum/' },
        { title: 'Contains Duplicate', link: 'https://leetcode.com/problems/contains-duplicate/' },
      ],
      code: {
        js: `// Using standard JS Map
const lookupMap = new Map();
lookupMap.set("key", "value");

if (lookupMap.has("key")) {
  const val = lookupMap.get("key");
  console.log(val);
}`,
        py: `# Using Python Dictionary
lookup_dict = {}
lookup_dict["key"] = "value"

if "key" in lookup_dict:
    val = lookup_dict["key"]
    print(val)`,
      },
    },

    sort_binary_search: {
      name: 'Sort + Binary Search',
      category: 'search',
      icon: 'fa-sort-numeric-down',
      color: '#3b82f6',
      tagline: 'Sort an unsorted array first to enable binary search.',
      description:
        'When search operations are going to be performed multiple times on unsorted data, it is highly efficient to sort the dataset once in O(n log n) time, and then run O(log n) binary searches.',
      complexity: {
        best: 'O(n log n)',
        avg: 'O(n log n)',
        worst: 'O(n log n)',
        space: 'O(n)',
      },
      strengths: [
        'Highly efficient if doing many lookups on unsorted data.',
        'Cleans up data for multiple algorithms.',
      ],
      weaknesses: [
        'Sorting is an expensive setup step.',
        'Not worth the overhead for a single, one-off search (use linear search).',
      ],
      path: 'Search → Unsorted → Can Sort First',
      problems: [
        {
          title: 'Intersection of Two Arrays II',
          link: 'https://leetcode.com/problems/intersection-of-two-arrays-ii/',
        },
      ],
      code: {
        js: `function sortAndSearch(arr, target) {
  // Sort ascending (O(n log n))
  arr.sort((a, b) => a - b);
  
  // Binary Search (O(log n))
  return binarySearch(arr, target);
}`,
        py: `def sort_and_search(arr, target):
    # Sort ascending (O(n log n))
    arr.sort()
    
    # Binary Search (O(log n))
    return binary_search(arr, target)`,
      },
    },

    merge_sort: {
      name: 'Merge Sort',
      category: 'sort',
      icon: 'fa-code-branch',
      color: '#ef4444',
      tagline: 'Stable O(n log n) Divide and Conquer sorting.',
      description:
        'Recursively splits the array into halves, sorts them, and merges the sorted halves back together. Guarantees O(n log n) time complexity and is highly stable (preserves relative order).',
      complexity: {
        best: 'O(n log n)',
        avg: 'O(n log n)',
        worst: 'O(n log n)',
        space: 'O(n)',
      },
      strengths: [
        'Guaranteed O(n log n) worst-case time.',
        'Stable sort: preserves relative position of equal values.',
      ],
      weaknesses: ['Requires O(n) auxiliary space for temp arrays (not in-place).'],
      path: 'Sort → Stable Sorting Required',
      problems: [
        { title: 'Sort an Array', link: 'https://leetcode.com/problems/sort-an-array/' },
        { title: 'Merge Sorted Array', link: 'https://leetcode.com/problems/merge-sorted-array/' },
      ],
      code: {
        js: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  let result = [], l = 0, r = 0;
  while (l < left.length && r < right.length) {
    if (left[l] <= right[r]) result.push(left[l++]);
    else result.push(right[r++]);
  }
  return result.concat(left.slice(l)).concat(right.slice(r));
}`,
        py: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    l = r = 0
    while l < len(left) and r < len(right):
        if left[l] <= right[r]:
            result.append(left[l])
            l += 1
        else:
            result.append(right[r])
            r += 1
    result.extend(left[l:])
    result.extend(right[r:])
    return result`,
      },
    },

    quick_sort: {
      name: 'Quick Sort',
      category: 'sort',
      icon: 'fa-bolt',
      color: '#ef4444',
      tagline: 'In-place average O(n log n) sorting.',
      description:
        "Selects a 'pivot' element, partitions the other elements into those less than and greater than the pivot, and recursively sorts the sub-arrays. Highly efficient cache locality.",
      complexity: {
        best: 'O(n log n)',
        avg: 'O(n log n)',
        worst: 'O(n^2)',
        space: 'O(log n)',
      },
      strengths: [
        'Very fast in practice with great cache locality.',
        'In-place sorting requiring minimal O(log n) recursive stack space.',
      ],
      weaknesses: [
        'Unstable sort: might shuffle equal elements.',
        'O(n^2) worst case if pivots are chosen poorly (e.g. sorted arrays).',
      ],
      path: 'Sort → In-Place + Fast Average Sorting',
      problems: [
        {
          title: 'Kth Largest Element in an Array',
          link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
        },
      ],
      code: {
        js: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`,
        py: `def quick_sort(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    if low < high:
        p_idx = partition(arr, low, high)
        quick_sort(arr, low, p_idx - 1)
        quick_sort(arr, p_idx + 1, high)
    return arr

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i] # Swap
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`,
      },
    },

    heap_sort: {
      name: 'Heap Sort',
      category: 'sort',
      icon: 'fa-cubes',
      color: '#ef4444',
      tagline: 'Guaranteed O(n log n) in-place sorting.',
      description:
        'Builds a max-heap from the input data, then repeatedly extracts the maximum element and restores the heap properties. Offers guaranteed O(n log n) worst-case time and O(1) space.',
      complexity: {
        best: 'O(n log n)',
        avg: 'O(n log n)',
        worst: 'O(n log n)',
        space: 'O(1)',
      },
      strengths: [
        'Guaranteed performance with no worst-case anomalies.',
        'In-place sorting with absolute constant space overhead O(1).',
      ],
      weaknesses: [
        'Unstable sort.',
        'Poor cache locality compared to Quick Sort due to constant index jumps.',
      ],
      path: 'Sort → In-Place + Guaranteed O(n log n) Worst-Case',
      problems: [{ title: 'Sort an Array', link: 'https://leetcode.com/problems/sort-an-array/' }],
      code: {
        js: `function heapSort(arr) {
  const n = arr.length;
  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr, n, i);
  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]]; // Swap root with last
    heapify(arr, i, 0);
  }
  return arr;
}

function heapify(arr, n, i) {
  let largest = i, l = 2 * i + 1, r = 2 * i + 2;
  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}`,
        py: `def heap_sort(arr):
    n = len(arr)
    # Build max heap
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    # Extract elements
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0] # Swap
        heapify(arr, i, 0)
    return arr

def heapify(arr, n, i):
    largest = i
    l = 2 * i + 1
    r = 2 * i + 2
    if l < n and arr[l] > arr[largest]:
        largest = l
    if r < n and arr[r] > arr[largest]:
        largest = r
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)`,
      },
    },

    insertion_sort: {
      name: 'Insertion Sort',
      category: 'sort',
      icon: 'fa-align-left',
      color: '#ef4444',
      tagline: 'Simple quadratic-time sorting for small datasets.',
      description:
        'Builds the final sorted array one item at a time by consuming one input element per repetition and placing it in its correct sorted position relative to already-sorted elements.',
      complexity: {
        best: 'O(n)',
        avg: 'O(n^2)',
        worst: 'O(n^2)',
        space: 'O(1)',
      },
      strengths: [
        'Highly efficient for small datasets (n < 50).',
        'Fastest sorting algorithm (linear O(n)) for nearly-sorted arrays.',
      ],
      weaknesses: ['Very slow for large unsorted lists due to quadratic execution.'],
      path: 'Sort → Small or Nearly Sorted Array',
      problems: [
        {
          title: 'Insertion Sort List',
          link: 'https://leetcode.com/problems/insertion-sort-list/',
        },
      ],
      code: {
        js: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
        py: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
      },
    },

    bfs: {
      name: 'Breadth-First Search (BFS)',
      category: 'graph',
      icon: 'fa-network-wired',
      color: '#10b981',
      tagline: 'Level-by-level traversal of graphs.',
      description:
        'Explores graph vertices layer-by-layer, visiting all neighbors of a node before moving to their neighbors. Uses a queue to manage traversal and guarantees shortest path in unweighted graphs.',
      complexity: {
        best: 'O(V + E)',
        avg: 'O(V + E)',
        worst: 'O(V + E)',
        space: 'O(V)',
      },
      strengths: [
        'Guarantees the shortest path in unweighted graphs.',
        'Simple implementation using queues.',
      ],
      weaknesses: [
        'Requires large memory layout O(V) to store queue contents.',
        'Cannot handle edge weight variations.',
      ],
      path: 'Graph → Unweighted Edges',
      problems: [
        { title: 'Rotting Oranges', link: 'https://leetcode.com/problems/rotting-oranges/' },
        {
          title: 'Binary Tree Level Order Traversal',
          link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
        },
      ],
      code: {
        js: `function bfs(graph, startNode) {
  const queue = [startNode];
  const visited = new Set([startNode]);
  
  while (queue.length > 0) {
    const node = queue.shift();
    console.log(node); // Process node
    
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`,
        py: `from collections import deque

def bfs(graph, start_node):
    queue = deque([start_node])
    visited = {start_node}
    
    while queue:
        node = queue.popleft()
        print(node) # Process node
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
      },
    },

    dijkstra: {
      name: "Dijkstra's Algorithm",
      category: 'graph',
      icon: 'fa-route',
      color: '#10b981',
      tagline: 'Shortest path in positive weighted graphs.',
      description:
        'Finds the shortest path from a single source vertex to all other vertices in a weighted graph with positive weights. Employs a Min-Priority Queue (Heap) to always greedily visit the nearest unvisited node.',
      complexity: {
        best: 'O((V + E) log V)',
        avg: 'O((V + E) log V)',
        worst: 'O((V + E) log V)',
        space: 'O(V)',
      },
      strengths: [
        'Extremely efficient single-source pathfinding.',
        'Works perfectly on dense positive-weighted networks.',
      ],
      weaknesses: [
        'Fails completely if any edge has a negative weight (causes infinite loops or incorrect answers).',
      ],
      path: 'Graph → Positive Weighted Edges → Single-Source',
      problems: [
        { title: 'Network Delay Time', link: 'https://leetcode.com/problems/network-delay-time/' },
      ],
      code: {
        js: `// Basic Dijkstra using simple array partition (use min heap for full efficiency)
function dijkstra(graph, start, numVertices) {
  const distances = Array(numVertices).fill(Infinity);
  const visited = Array(numVertices).fill(false);
  distances[start] = 0;
  
  for (let i = 0; i < numVertices; i++) {
    // Find closest unvisited vertex
    let u = -1;
    for (let j = 0; j < numVertices; j++) {
      if (!visited[j] && (u === -1 || distances[j] < distances[u])) u = j;
    }
    if (distances[u] === Infinity) break;
    visited[u] = true;
    
    for (const [v, weight] of graph[u] || []) {
      if (distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
      }
    }
  }
  return distances;
}`,
        py: `import heapq

def dijkstra(graph, start, num_vertices):
    distances = {i: float('inf') for i in range(num_vertices)}
    distances[start] = 0
    pq = [(0, start)] # Min heap storing (distance, node)
    
    while pq:
        dist, u = heapq.heappop(pq)
        if dist > distances[u]:
            continue
            
        for v, weight in graph.get(u, []):
            if distances[u] + weight < distances[v]:
                distances[v] = distances[u] + weight
                heapq.heappush(pq, (distances[v], v))
                
    return distances`,
      },
    },

    bellman_ford: {
      name: 'Bellman-Ford Algorithm',
      category: 'graph',
      icon: 'fa-triangle-exclamation',
      color: '#10b981',
      tagline: 'Shortest path in negative weighted graphs.',
      description:
        'Computes single-source shortest paths on graphs where edge weights can be negative. Relaxes all edges V-1 times. Also detects negative-weight cycles in the graph.',
      complexity: {
        best: 'O(E)',
        avg: 'O(V * E)',
        worst: 'O(V * E)',
        space: 'O(V)',
      },
      strengths: [
        'Handles negative edge weights successfully.',
        'Detects negative cycles in graphs (e.g. infinite arbitrage loops).',
      ],
      weaknesses: ['Slower execution than Dijkstra (quadratic scaling).'],
      path: 'Graph → Negative Weighted Edges',
      problems: [
        {
          title: 'Cheapest Flights Within K Stops',
          link: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/',
        },
      ],
      code: {
        js: `function bellmanFord(edges, numVertices, start) {
  const distances = Array(numVertices).fill(Infinity);
  distances[start] = 0;
  
  // Relax edges V - 1 times
  for (let i = 0; i < numVertices - 1; i++) {
    for (const [u, v, w] of edges) {
      if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
        distances[v] = distances[u] + w;
      }
    }
  }
  
  // Check for negative weight cycles
  for (const [u, v, w] of edges) {
    if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
      console.log("Graph contains negative weight cycle!");
      return null;
    }
  }
  return distances;
}`,
        py: `def bellman_ford(edges, num_vertices, start):
    distances = [float('inf')] * num_vertices
    distances[start] = 0
    
    # Relax edges V - 1 times
    for _ in range(num_vertices - 1):
        for u, v, w in edges:
            if distances[u] != float('inf') and distances[u] + w < distances[v]:
                distances[v] = distances[u] + w
                
    # Check negative cycle
    for u, v, w in edges:
        if distances[u] != float('inf') and distances[u] + w < distances[v]:
            print("Graph contains negative weight cycle!")
            return None
            
    return distances`,
      },
    },

    floyd_warshall: {
      name: 'Floyd-Warshall Algorithm',
      category: 'graph',
      icon: 'fa-chess-board',
      color: '#10b981',
      tagline: 'All-pairs shortest paths using DP.',
      description:
        'A dynamic programming algorithm that finds shortest path distances between all pairs of nodes in a graph. Traverses nodes k as intermediate stepping stones.',
      complexity: {
        best: 'O(V^3)',
        avg: 'O(V^3)',
        worst: 'O(V^3)',
        space: 'O(V^2)',
      },
      strengths: [
        'Calculates path weights between every single node pair at once.',
        'Simple implementation using 3 nested loops.',
      ],
      weaknesses: [
        'Heavy computation cost O(V^3); only suitable for graphs with under ~500 nodes.',
      ],
      path: 'Graph → Positive Weighted Edges → All-Pairs',
      problems: [
        {
          title: 'Find City with Smallest Neighbors',
          link: 'https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/',
        },
      ],
      code: {
        js: `function floydWarshall(matrix, n) {
  const dist = Array.from({ length: n }, (_, i) => [...matrix[i]]);
  
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  return dist;
}`,
        py: `def floyd_warshall(matrix, n):
    dist = [row[:] for row in matrix]
    
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    
    return dist`,
      },
    },

    sliding_window: {
      name: 'Sliding Window',
      category: 'opt',
      icon: 'fa-arrows-left-right-to-line',
      color: '#f59e0b',
      tagline: 'Linear window sliding to capture contiguous sections.',
      description:
        'Maintains a running subarray or substring window bounded by left and right pointers. Expands the right pointer to gather data and contracts the left pointer to optimize constraints in linear O(n) time.',
      complexity: {
        best: 'O(n)',
        avg: 'O(n)',
        worst: 'O(n)',
        space: 'O(1)',
      },
      strengths: [
        'Converts nested loop problems O(n^2) to simple linear scans O(n).',
        'Extremely low space usage (O(1) memory).',
      ],
      weaknesses: [
        'Only works on contiguous sub-segments.',
        'Fails if constraints break the monotonic expanding/contracting logic (e.g. mixed negative numbers).',
      ],
      path: 'Optimization → Contiguous Subarray → Non-negative/Monotonic',
      problems: [
        {
          title: 'Longest Substring Without Repeating Characters',
          link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        },
        {
          title: 'Minimum Size Subarray Sum',
          link: 'https://leetcode.com/problems/minimum-size-subarray-sum/',
        },
      ],
      code: {
        js: `function maxSubarraySum(arr, k) {
  let maxSum = 0, windowSum = 0;
  if (arr.length < k) return 0;
  
  // Create first window
  for (let i = 0; i < k; i++) windowSum += arr[i];
  maxSum = windowSum;
  
  // Slide window across array
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // Add next, remove first
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`,
        py: `def max_subarray_sum(arr, k):
    n = len(arr)
    if n < k:
        return 0
    # First window
    window_sum = sum(arr[:k])
    max_sum = window_sum
    # Slide
    for i in range(k, n):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum`,
      },
    },

    prefix_sum: {
      name: 'Prefix Sum / Map',
      category: 'opt',
      icon: 'fa-calculator',
      color: '#f59e0b',
      tagline: 'Precalculated cumulative array additions.',
      description:
        'Creates an auxiliary array where each index stores the sum of all elements up to that point. Combined with a hash map, it easily identifies target sum segments in unsorted arrays containing positive and negative values.',
      complexity: {
        best: 'O(n)',
        avg: 'O(n)',
        worst: 'O(n)',
        space: 'O(n)',
      },
      strengths: [
        'Solves contiguous sum tasks on arrays containing negative integers.',
        'Allows O(1) query time for range sum calculations.',
      ],
      weaknesses: ['Requires O(n) memory space allocation.'],
      path: 'Optimization → Contiguous Subarray → Negative Values Included',
      problems: [
        {
          title: 'Subarray Sum Equals K',
          link: 'https://leetcode.com/problems/subarray-sum-equals-k/',
        },
      ],
      code: {
        js: `function subarraySum(arr, k) {
  const map = new Map([[0, 1]]); // prefixSum -> count
  let sum = 0, count = 0;
  
  for (let num of arr) {
    sum += num;
    if (map.has(sum - k)) {
      count += map.get(sum - k);
    }
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
}`,
        py: `def subarray_sum(arr, k):
    hash_map = {0: 1} # prefix_sum -> count
    curr_sum = 0
    count = 0
    
    for num in arr:
        curr_sum += num
        if curr_sum - k in hash_map:
            count += hash_map[curr_sum - k]
        hash_map[curr_sum] = hash_map.get(curr_sum, 0) + 1
        
    return count`,
      },
    },

    backtracking: {
      name: 'Backtracking',
      category: 'opt',
      icon: 'fa-rotate-left',
      color: '#f59e0b',
      tagline: 'Brute-force state space search with pruning.',
      description:
        "Systematically searches all configurations of a problem's state space recursively. If a path fails to meet constraints, it 'backtracks' (steps back) to the previous choice and tries a different branch.",
      complexity: {
        best: 'O(1)',
        avg: 'O(2^n) or O(n!)',
        worst: 'O(2^n) or O(n!)',
        space: 'O(n)',
      },
      strengths: [
        'Guarantees finding all valid solutions to a problem.',
        'Pruning branches early optimizes runtimes significantly compared to naive search.',
      ],
      weaknesses: ['Exponential time complexity: only works on small inputs (e.g. n < 20).'],
      path: 'Optimization → Non-Contiguous → Generate All Permutations/Subsets',
      problems: [
        { title: 'Subsets', link: 'https://leetcode.com/problems/subsets/' },
        { title: 'Permutations', link: 'https://leetcode.com/problems/permutations/' },
      ],
      code: {
        js: `function generateSubsets(nums) {
  const result = [];
  function backtrack(start, currentPath) {
    result.push([...currentPath]);
    for (let i = start; i < nums.length; i++) {
      currentPath.push(nums[i]); // Choose
      backtrack(i + 1, currentPath); // Explore
      currentPath.pop(); // Backtrack (Unchoose)
    }
  }
  backtrack(0, []);
  return result;
}`,
        py: `def subsets(nums):
    result = []
    def backtrack(start, path):
        result.append(list(path))
        for i in range(start, len(nums)):
            path.append(nums[i]) # Choose
            backtrack(i + 1, path) # Explore
            path.pop() # Backtrack (Unchoose)
    backtrack(0, [])
    return result`,
      },
    },

    dp: {
      name: 'Dynamic Programming (DP)',
      category: 'opt',
      icon: 'fa-brain',
      color: '#f59e0b',
      tagline: 'Divide and solve using stored subproblem values.',
      description:
        'Solves optimization problems with overlapping subproblems and optimal substructures. Solves subproblems once and caches the results in a lookup table (memoization or tabulation) to prevent redundant calculations.',
      complexity: {
        best: 'O(n * m)',
        avg: 'O(n * m)',
        worst: 'O(n * m)',
        space: 'O(n * m)',
      },
      strengths: [
        'Converts exponential recurrence equations O(2^n) into linear/quadratic algorithms O(n).',
        'Perfect for calculating counts, ways, or min/max values.',
      ],
      weaknesses: [
        'High memory overhead for tabulation state arrays.',
        'Difficult to design state transitions and base cases.',
      ],
      path: 'Optimization → Non-Contiguous → Min/Max/Count → Greedy Fails',
      problems: [
        { title: 'Coin Change', link: 'https://leetcode.com/problems/coin-change/' },
        {
          title: 'Longest Common Subsequence',
          link: 'https://leetcode.com/problems/longest-common-subsequence/',
        },
      ],
      code: {
        js: `function fibonacci(n) {
  if (n <= 1) return n;
  const dp = Array(n + 1).fill(0);
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`,
        py: `def fibonacci(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
      },
    },

    greedy: {
      name: 'Greedy Algorithms',
      category: 'opt',
      icon: 'fa-hand-holding-dollar',
      color: '#f59e0b',
      tagline: 'Always choose local best option at each step.',
      description:
        "Builds a solution piece-by-piece by always choosing the next option that offers the most immediate, local benefit. Requires the problem to have the 'greedy choice property' (local choices lead to global optimum).",
      complexity: {
        best: 'O(n log n)',
        avg: 'O(n log n)',
        worst: 'O(n log n)',
        space: 'O(1)',
      },
      strengths: [
        'Extremely fast and lightweight compared to full Dynamic Programming.',
        'Usually simple to implement once proven.',
      ],
      weaknesses: [
        'Requires complex mathematical proofs to verify correctness.',
        'Many problems fail greedy choices (e.g. Coin Change fails on random denominations).',
      ],
      path: 'Optimization → Non-Contiguous → Min/Max/Count → Greedy Choice Optimal',
      problems: [
        { title: 'Merge Intervals', link: 'https://leetcode.com/problems/merge-intervals/' },
        { title: 'Jump Game', link: 'https://leetcode.com/problems/jump-game/' },
      ],
      code: {
        js: `// Greedy Interval Selection Example
function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;
  // Sort by end time
  intervals.sort((a, b) => a[1] - b[1]);
  
  let count = 0;
  let end = intervals[0][1];
  
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < end) {
      count++; // Overlap - remove greedily
    } else {
      end = intervals[i][1];
    }
  }
  return count;
}`,
        py: `# Greedy Interval Selection Example
def erase_overlap_intervals(intervals):
    if not intervals:
        return 0
    # Sort by end time
    intervals.sort(key=lambda x: x[1])
    
    count = 0
    end = intervals[0][1]
    
    for i in range(1, len(intervals)):
        if intervals[i][0] < end:
            count += 1 # Overlap - remove greedily
        else:
            end = intervals[i][1]
    return count`,
      },
    },

    trie: {
      name: 'Trie (Prefix Tree)',
      category: 'string',
      icon: 'fa-spell-check',
      color: '#8b5cf6',
      tagline: 'Prefix lookup tree for strings.',
      description:
        'A tree-like data structure where each node represents a character of a string. Shared prefixes of different strings share the same nodes. Perfect for autocomplete and word dictionary searches.',
      complexity: {
        best: 'O(L)',
        avg: 'O(L)',
        worst: 'O(L)',
        space: 'O(W * L)',
      },
      strengths: [
        'Lookup time is independent of catalog size, only depends on target word length L.',
        'Saves memory by grouping identical prefixes.',
      ],
      weaknesses: ['High memory overhead due to multiple child pointer arrays on each node.'],
      path: 'Strings → Prefix/Dictionary Searches',
      problems: [
        {
          title: 'Implement Trie',
          link: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
        },
      ],
      code: {
        js: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  insert(word) {
    let curr = this.root;
    for (let char of word) {
      if (!curr.children[char]) curr.children[char] = new TrieNode();
      curr = curr.children[char];
    }
    curr.isEnd = true;
  }
  startsWith(prefix) {
    let curr = this.root;
    for (let char of prefix) {
      if (!curr.children[char]) return false;
      curr = curr.children[char];
    }
    return true;
  }
}`,
        py: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
        
    def insert(self, word):
        curr = self.root
        for char in word:
            if char not in curr.children:
                curr.children[char] = TrieNode()
            curr = curr.children[char]
        curr.is_end = True
        
    def starts_with(self, prefix):
        curr = self.root
        for char in prefix:
            if char not in curr.children:
                return False
            curr = curr.children[char]
        return True`,
      },
    },

    kmp: {
      name: 'KMP Algorithm',
      category: 'string',
      icon: 'fa-magnifying-glass-chart',
      color: '#8b5cf6',
      tagline: 'Linear time substring pattern matching.',
      description:
        "Searches for occurrences of a 'pattern' string inside a longer 'text' string. Uses a prefix lookup table constructed from the pattern to avoid backtracking matching indices on mismatches.",
      complexity: {
        best: 'O(n)',
        avg: 'O(n + m)',
        worst: 'O(n + m)',
        space: 'O(m)',
      },
      strengths: [
        'Linear O(n + m) time complexity.',
        'Never backs up the main text index pointer, great for streaming inputs.',
      ],
      weaknesses: ['Complex preprocessing step to build prefix array.'],
      path: 'Strings → Pattern Search / Occurrences',
      problems: [
        {
          title: 'Find Index of First Substring Match',
          link: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/',
        },
      ],
      code: {
        js: `function kmpSearch(text, pattern) {
  const lps = buildLPS(pattern);
  let i = 0, j = 0;
  while (i < text.length) {
    if (text[i] === pattern[j]) { i++; j++; }
    if (j === pattern.length) return i - j; // Match found
    else if (i < text.length && text[i] !== pattern[j]) {
      if (j !== 0) j = lps[j - 1];
      else i++;
    }
  }
  return -1;
}

function buildLPS(pattern) {
  const lps = Array(pattern.length).fill(0);
  let len = 0, i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) lps[i++] = ++len;
    else if (len !== 0) len = lps[len - 1];
    else lps[i++] = 0;
  }
  return lps;
}`,
        py: `def kmp_search(text, pattern):
    lps = build_lps(pattern)
    i = j = 0
    while i < len(text):
        if text[i] == pattern[j]:
            i += 1
            j += 1
        if j == len(pattern):
            return i - j # Match found
        elif i < len(text) and text[i] != pattern[j]:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1
    return -1

def build_lps(pattern):
    lps = [0] * len(pattern)
    length = 0
    i = 1
    while i < len(pattern):
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length != 0:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1
    return lps`,
      },
    },
  };

  // ==========================================================================
  // 2. Decision Tree Schema
  // ==========================================================================
  const DECISION_TREE = {
    root: {
      question: 'What type of problem are you trying to solve?',
      hint: 'Select the primary computational category of your task.',
      options: [
        { label: 'Search for a value', next: 'search_start', icon: 'fa-magnifying-glass' },
        { label: 'Sort a collection of data', next: 'sort_start', icon: 'fa-arrow-down-a-z' },
        { label: 'Graph traversal / Pathfinding', next: 'graph_start', icon: 'fa-diagram-project' },
        { label: 'Find optimal subarray / subsets', next: 'opt_start', icon: 'fa-chart-line' },
        { label: 'String and text manipulations', next: 'string_start', icon: 'fa-font' },
      ],
    },

    // --- SEARCH BRANCH ---
    search_start: {
      question: 'Is your input collection sorted?',
      hint: 'Binary search algorithms require elements to be ordered in memory.',
      options: [
        { label: 'Yes, it is sorted', next: 'search_sorted_fast' },
        { label: 'No, it is unsorted', next: 'search_unsorted_strategy' },
      ],
    },
    search_sorted_fast: {
      question: 'Do you need the fastest possible lookup?',
      hint: 'O(log n) binary search is vastly superior to standard linear scanning.',
      options: [
        { label: 'Yes, O(log n) speed is critical', next: 'result_binary_search' },
        { label: 'No, linear traversal is fine', next: 'result_linear_search' },
      ],
    },
    search_unsorted_strategy: {
      question: 'What constraints do you have on resource space?',
      hint: 'We can sort data first, use extra memory lookup tables, or search in-place.',
      options: [
        { label: 'I can spare extra memory for fast lookups', next: 'result_hash_map' },
        {
          label: 'I can sort first (doing multiple searches later)',
          next: 'result_sort_binary_search',
        },
        { label: 'No extra memory, must search in-place', next: 'result_linear_search' },
      ],
    },

    // --- SORTING BRANCH ---
    sort_start: {
      question: 'What is your primary design priority for sorting?',
      hint: 'Decide if memory limits, stable duplicate ordering, or simplicity is key.',
      options: [
        { label: 'Keep duplicate order identical (Stable sort)', next: 'result_merge_sort' },
        { label: 'Fastest average sort + low memory (In-place sort)', next: 'result_quick_sort' },
        { label: 'Absolute guaranteed worst-case speed + in-place', next: 'result_heap_sort' },
        { label: 'Small array / nearly sorted dataset', next: 'result_insertion_sort' },
      ],
    },

    // --- GRAPH BRANCH ---
    graph_start: {
      question: 'Are edges in your graph weighted?',
      hint: 'Weights represent travel costs/lengths between nodes.',
      options: [
        { label: 'No, weights are identical (or unweighted)', next: 'result_bfs' },
        { label: 'Yes, weights are positive numbers', next: 'graph_single_source' },
        { label: 'Yes, weights can be negative values', next: 'result_bellman_ford' },
      ],
    },
    graph_single_source: {
      question: 'Do you need shortest paths from one node, or all nodes?',
      hint: 'Single-source computes distances from a single start; All-pairs computes all configurations.',
      options: [
        { label: 'Single-source paths (one node start)', next: 'result_dijkstra' },
        { label: 'All-pairs paths (every node combination)', next: 'result_floyd_warshall' },
      ],
    },

    // --- OPTIMIZATION BRANCH ---
    opt_start: {
      question: 'Are you examining contiguous subarrays, or non-contiguous sets?',
      hint: 'Contiguous segments allow sliding windows; general optimization uses backtracking/DP.',
      options: [
        { label: 'Contiguous subsegments (Subarrays/Substrings)', next: 'opt_contiguous' },
        { label: 'Non-contiguous elements (Subsets/Combinations)', next: 'opt_non_contiguous' },
      ],
    },
    opt_contiguous: {
      question: 'Are array elements non-negative or strictly monotonic?',
      hint: 'Sliding window bounds break if variables increase and decrease chaotically.',
      options: [
        { label: 'Yes, monotonic window adjustments work', next: 'result_sliding_window' },
        { label: 'No, includes negatives (need prefix counts)', next: 'result_prefix_sum' },
      ],
    },
    opt_non_contiguous: {
      question: 'Do you need to generate ALL configurations, or find an optimal score?',
      hint: 'Generating all combinations takes backtracking; finding min/max/counts uses DP/Greedy.',
      options: [
        {
          label: 'Generate all configuration solutions (Permutations/Combinations)',
          next: 'result_backtracking',
        },
        { label: 'Find min/max value, ways, or counts', next: 'opt_greedy_choice' },
      ],
    },
    opt_greedy_choice: {
      question: 'Does local optimal selection guarantee global correctness?',
      hint: 'If choosing local best choice is always optimal, Greedy is faster; otherwise check DP.',
      options: [
        { label: 'Yes, local best choice is always safe (Greedy)', next: 'result_greedy' },
        { label: 'No, subproblem overlaps require DP table storage', next: 'result_dp' },
      ],
    },

    // --- STRING BRANCH ---
    string_start: {
      question: 'What is the primary text operation?',
      hint: 'Choose between dictionary prefix matchings or finding single patterns.',
      options: [
        { label: 'Lookup prefix dictionary / autocomplete keys', next: 'result_trie' },
        { label: 'Locate occurrences of pattern matches inside text', next: 'result_kmp' },
      ],
    },
  };

  // ==========================================================================
  // 3. State Management & Variables
  // ==========================================================================
  let currentNodeId = 'root';
  const pathHistory = []; // Stack containing { nodeId, choiceLabel }
  let activeLanguage = 'js';
  let activeAlgorithm = null;

  // DOM elements
  const wizardCard = document.getElementById('adtWizardCard');
  const questionPanel = document.getElementById('adtQuestionPanel');
  const progressEl = document.getElementById('adtProgress');
  const trailContainer = document.getElementById('adtTrailContainer');
  const trailStepsEl = document.getElementById('adtTrailSteps');
  const resultSection = document.getElementById('adtResultSection');

  const restartBtn = document.getElementById('adtRestartBtn');
  const backToTreeBtn = document.getElementById('adtBackToTreeBtn');
  const copyBtn = document.getElementById('adtCopyBtn');
  const codeContentEl = document.getElementById('adtCodeContent');
  const languageButtons = document.querySelectorAll('.adt-tab-buttons .adt-tab-btn');

  const libraryGridEl = document.getElementById('adtLibraryGrid');
  const libraryFilterBtns = document.querySelectorAll('.adt-library-filters .adt-filter-btn');

  if (!wizardCard || !questionPanel) return;

  // ==========================================================================
  // 4. Decision Tree Flow Implementation
  // ==========================================================================

  function initWizard() {
    currentNodeId = 'root';
    pathHistory.length = 0;

    resultSection.classList.remove('visible');
    wizardCard.style.display = 'block';
    wizardCard.style.opacity = '1';
    wizardCard.style.transform = 'translateY(0)';
    trailContainer.classList.add('hidden');

    renderProgress();
    renderQuestion();
  }

  function renderProgress() {
    let stepsHtml = '';
    const activeIndex = pathHistory.length;
    // Decision paths typically have at most 4 steps
    const maxSteps = 4;

    for (let i = 0; i < maxSteps; i++) {
      let stepClass = '';
      if (i < activeIndex) stepClass = 'completed';
      else if (i === activeIndex) stepClass = 'active';

      stepsHtml += `<div class="adt-progress-step ${stepClass}">`;
      stepsHtml += i < activeIndex ? `<i class="fas fa-check"></i>` : i + 1;
      stepsHtml += `</div>`;

      if (i < maxSteps - 1) {
        const lineClass = i < activeIndex ? 'completed' : '';
        stepsHtml += `<div class="adt-progress-line ${lineClass}"></div>`;
      }
    }
    progressEl.innerHTML = stepsHtml;
  }

  function renderBreadcrumbs() {
    if (pathHistory.length === 0) {
      trailContainer.classList.add('hidden');
      return;
    }

    trailContainer.classList.remove('hidden');
    let html = `<button type="button" class="adt-trail-step" data-index="-1">Home</button>`;

    pathHistory.forEach((step, idx) => {
      html += `<div class="adt-trail-arrow"><i class="fas fa-chevron-right"></i></div>`;
      html += `<button type="button" class="adt-trail-step" data-index="${idx}">${step.choiceLabel}</button>`;
    });

    trailStepsEl.innerHTML = html;

    // Attach event listeners to breadcrumbs
    trailStepsEl.querySelectorAll('.adt-trail-step').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetIndex = parseInt(btn.dataset.index);
        rewindTo(targetIndex);
      });
    });
  }

  function renderQuestion() {
    const node = DECISION_TREE[currentNodeId];
    if (!node) return;

    // Slide transition exit
    questionPanel.classList.remove('adt-slide-enter');
    questionPanel.classList.add('adt-slide-exit');

    setTimeout(() => {
      let optionsHtml = '';
      node.options.forEach((opt) => {
        const iconClass = opt.icon || 'fa-circle-question';
        optionsHtml += `
          <button type="button" class="adt-option-btn" data-next="${opt.next}" data-label="${opt.label}">
            <i class="fas ${iconClass}"></i>
            <span>${opt.label}</span>
          </button>
        `;
      });

      // Question Icon
      let qIcon = 'fa-network-wired';
      if (currentNodeId.includes('search')) qIcon = 'fa-magnifying-glass';
      else if (currentNodeId.includes('sort')) qIcon = 'fa-arrow-down-a-z';
      else if (currentNodeId.includes('graph')) qIcon = 'fa-diagram-project';
      else if (currentNodeId.includes('opt')) qIcon = 'fa-chart-line';
      else if (currentNodeId.includes('string')) qIcon = 'fa-font';

      questionPanel.innerHTML = `
        <div class="adt-question-icon"><i class="fas ${qIcon}"></i></div>
        <h2 class="adt-question-text">${node.question}</h2>
        <p class="adt-question-hint">${node.hint}</p>
        <div class="adt-options-group">${optionsHtml}</div>
      `;

      // Back navigation button inside card if history is available
      if (pathHistory.length > 0) {
        questionPanel.innerHTML += `
          <div class="adt-nav-row">
            <button type="button" class="btn btn-secondary" id="adtCardBackBtn">
              <i class="fas fa-arrow-left"></i> Back
            </button>
            <span style="font-size: 0.8rem; color: var(--text-secondary)">Step ${pathHistory.length + 1}</span>
          </div>
        `;
      }

      // Slide transition enter
      questionPanel.classList.remove('adt-slide-exit');
      questionPanel.classList.add('adt-slide-enter');

      // Attach option listeners
      questionPanel.querySelectorAll('.adt-option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          handleChoice(btn.dataset.next, btn.dataset.label);
        });
      });

      // Attach back listener
      const backBtn = document.getElementById('adtCardBackBtn');
      if (backBtn) {
        backBtn.addEventListener('click', goBackStep);
      }
    }, 200);
  }

  function handleChoice(nextNodeId, choiceLabel) {
    // Record current step in history
    pathHistory.push({
      nodeId: currentNodeId,
      choiceLabel: choiceLabel,
    });

    if (nextNodeId.startsWith('result_')) {
      const algoKey = nextNodeId.replace('result_', '');
      showRecommendation(algoKey);
    } else {
      currentNodeId = nextNodeId;
      renderProgress();
      renderBreadcrumbs();
      renderQuestion();
    }
  }

  function goBackStep() {
    if (pathHistory.length === 0) return;
    const lastStep = pathHistory.pop();
    currentNodeId = lastStep.nodeId;
    renderProgress();
    renderBreadcrumbs();
    renderQuestion();
  }

  function rewindTo(index) {
    if (index === -1) {
      initWizard();
    } else {
      // Pop history back to target index
      pathHistory.length = index + 1;
      const lastStep = pathHistory.pop();
      currentNodeId = lastStep.nodeId;
      renderProgress();
      renderBreadcrumbs();
      renderQuestion();
      resultSection.classList.remove('visible');
      wizardCard.style.display = 'block';
      setTimeout(() => {
        wizardCard.style.opacity = '1';
        wizardCard.style.transform = 'translateY(0)';
      }, 50);
    }
  }

  // ==========================================================================
  // 5. Leaf Node Recommendation Logic
  // ==========================================================================

  function showRecommendation(algoKey) {
    const algo = ALGORITHMS[algoKey];
    if (!algo) return;

    activeAlgorithm = algo;

    // Update trail breadcrumbs
    renderBreadcrumbs();

    // Hide wizard card with smooth fade
    wizardCard.style.opacity = '0';
    wizardCard.style.transform = 'translateY(-15px)';
    setTimeout(() => {
      wizardCard.style.display = 'none';

      // Load Algorithm details into DOM
      document.getElementById('adtRecName').textContent = algo.name;
      document.getElementById('adtRecTagline').textContent = algo.tagline;

      // Icon color styling based on category
      const iconWrapper = document.getElementById('adtRecIcon');
      iconWrapper.className = 'adt-rec-icon-wrapper';
      let catColor = '#7c3aed'; // Default primary purple
      if (algo.category === 'search') catColor = 'var(--adt-search)';
      else if (algo.category === 'sort') catColor = 'var(--adt-sort)';
      else if (algo.category === 'graph') catColor = 'var(--adt-graph)';
      else if (algo.category === 'opt') catColor = 'var(--adt-opt)';
      else if (algo.category === 'string') catColor = 'var(--adt-string)';

      iconWrapper.style.background = `linear-gradient(135deg, ${catColor} 0%, rgba(0, 0, 0, 0.4) 100%)`;
      iconWrapper.style.boxShadow = `0 8px 24px ${catColor}44`;

      const iconClass = algo.icon || 'fa-code';
      iconWrapper.innerHTML = `<i class="fas ${iconClass}"></i>`;

      // Complexity badges
      const compGrid = document.getElementById('adtComplexityGrid');
      compGrid.innerHTML = `
        <div class="adt-complexity-chip">
          <span class="adt-complexity-value">${algo.complexity.best}</span>
          <span class="adt-complexity-label">Best Time</span>
        </div>
        <div class="adt-complexity-chip">
          <span class="adt-complexity-value">${algo.complexity.avg}</span>
          <span class="adt-complexity-label">Average Time</span>
        </div>
        <div class="adt-complexity-chip">
          <span class="adt-complexity-value">${algo.complexity.worst}</span>
          <span class="adt-complexity-label">Worst Time</span>
        </div>
        <div class="adt-complexity-chip">
          <span class="adt-complexity-value">${algo.complexity.space}</span>
          <span class="adt-complexity-label">Space Complexity</span>
        </div>
      `;

      // Strengths
      const strengthsList = document.getElementById('adtStrengths');
      strengthsList.className = 'adt-trait-list strengths';
      strengthsList.innerHTML = algo.strengths
        .map((s) => `<li><i class="fas fa-check-circle"></i> ${s}</li>`)
        .join('');

      // Weaknesses
      const weaknessesList = document.getElementById('adtWeaknesses');
      weaknessesList.className = 'adt-trait-list weaknesses';
      weaknessesList.innerHTML = algo.weaknesses
        .map((w) => `<li><i class="fas fa-exclamation-circle"></i> ${w}</li>`)
        .join('');

      // Problems
      const problemsList = document.getElementById('adtProblemsList');
      if (algo.problems && algo.problems.length > 0) {
        problemsList.innerHTML = algo.problems
          .map(
            (prob) => `
          <a href="${prob.link}" target="_blank" rel="noopener noreferrer" class="adt-problem-link">
            <span><i class="fas fa-link"></i> ${prob.title}</span>
            <span class="adt-problem-diff easy">Practice <i class="fas fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i></span>
          </a>
        `
          )
          .join('');
      } else {
        problemsList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">No similar problems mapped. Try searching LeetCode for ${algo.name}.</p>`;
      }

      // Code snippets
      syncCodeLanguage();

      // Show result section
      resultSection.classList.add('visible');
    }, 250);
  }

  function syncCodeLanguage() {
    if (!activeAlgorithm) return;

    // Set code container class and contents
    if (activeLanguage === 'js') {
      codeContentEl.className = 'language-javascript';
      codeContentEl.textContent = activeAlgorithm.code.js;
    } else {
      codeContentEl.className = 'language-python';
      codeContentEl.textContent = activeAlgorithm.code.py;
    }

    // Toggle active classes on tab buttons
    languageButtons.forEach((btn) => {
      if (btn.dataset.lang === activeLanguage) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function copyCodeSnippet() {
    const textToCopy = codeContentEl.textContent;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="fas fa-check"></i> Copied!`;
        copyBtn.style.color = '#10b981';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.style.color = '';
        }, 1500);
      })
      .catch((err) => {
        console.error('Failed to copy code: ', err);
      });
  }

  // ==========================================================================
  // 6. Reference Library Logic
  // ==========================================================================

  function renderLibrary() {
    if (!libraryGridEl) return;

    let html = '';
    Object.keys(ALGORITHMS).forEach((key) => {
      const algo = ALGORITHMS[key];
      let catColor = '#7c3aed';
      if (algo.category === 'search') catColor = 'var(--adt-search)';
      else if (algo.category === 'sort') catColor = 'var(--adt-sort)';
      else if (algo.category === 'graph') catColor = 'var(--adt-graph)';
      else if (algo.category === 'opt') catColor = 'var(--adt-opt)';
      else if (algo.category === 'string') catColor = 'var(--adt-string)';

      const iconClass = algo.icon || 'fa-code';

      html += `
        <div class="adt-library-card" data-key="${key}" data-category="${algo.category}">
          <div>
            <div class="adt-lib-header">
              <div class="adt-lib-icon" style="background: linear-gradient(135deg, ${catColor} 0%, rgba(0, 0, 0, 0.4) 100%)">
                <i class="fas ${iconClass}"></i>
              </div>
              <div class="adt-lib-name">${algo.name}</div>
            </div>
            <p class="adt-lib-desc">${algo.description}</p>
          </div>
          <div class="adt-lib-meta">
            <span class="adt-lib-path"><i class="fas fa-route"></i> ${algo.path.split(' → ').pop()}</span>
            <span class="adt-lib-complexity">${algo.complexity.avg}</span>
          </div>
        </div>
      `;
    });

    libraryGridEl.innerHTML = html;

    // Attach click listeners to library cards to show details in assistant card
    libraryGridEl.querySelectorAll('.adt-library-card').forEach((card) => {
      card.addEventListener('click', () => {
        const key = card.dataset.key;
        showRecommendation(key);
        // Scroll to assistant section
        const assistantSec = document.getElementById('assistant');
        if (assistantSec) {
          assistantSec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function filterLibrary(filterVal) {
    const cards = libraryGridEl.querySelectorAll('.adt-library-card');
    cards.forEach((card) => {
      if (filterVal === 'all' || card.dataset.category === filterVal) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    // Update active state of filter buttons
    libraryFilterBtns.forEach((btn) => {
      if (btn.dataset.filter === filterVal) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // 7. Event Binding & Initialization
  // ==========================================================================

  if (restartBtn) {
    restartBtn.addEventListener('click', initWizard);
  }

  if (backToTreeBtn) {
    backToTreeBtn.addEventListener('click', () => {
      resultSection.classList.remove('visible');
      wizardCard.style.display = 'block';
      setTimeout(() => {
        wizardCard.style.opacity = '1';
        wizardCard.style.transform = 'translateY(0)';
      }, 50);
      goBackStep();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', copyCodeSnippet);
  }

  // Language buttons
  languageButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeLanguage = btn.dataset.lang;
      syncCodeLanguage();
    });
  });

  // Library category buttons
  libraryFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterLibrary(btn.dataset.filter);
    });
  });

  // Start initialization
  initWizard();
  renderLibrary();
})();
