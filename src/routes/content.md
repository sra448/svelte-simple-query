# Svelte Simple Query

Svelte Simple Query is a small library that helps simplify working with asynchronous data by allowing you to declaratively define queries and use them in your components.

Under the hood this library is very simple. Svelte 5's $state rune makes it trivial to pack away some data and have changes to it propagated to all consumers. Svelte Simple Query is just a bunch of reactive state and some functions that make it easy to work with these states.

It is inspired by Tanstack Query which is a great library and you should consider using it instead. Svelte Simple Query is much smaller and does not aim for feature parity.

## Queries

A query is a simple abstraction that ties together some data and the key that identifies it. The query takes care of caching and reloading its data. It also provides access to the current data, its loading state and any errors that happened during loading.

### Creating a Query

To create a query you use the `createQuery` function. It expects a unique key and an async function that returns the data or an error. It returns a function that can be called to initiate the query in your component.

    const useFriends = createQuery(
      ['friends'],
      async () => {
        try {
          const data = await fetchFriends();
          return { success: true, data };
        } catch (error) {
          return { success: false, error };
        }
      }
    );

### Query Key

The key of a query is used for caching the data. In order to identify nested or hierarchical data, the key is a `string[]`. It has to be unique, otherwise different queries will overwrite each others data.

The key can also be a function of type `(param: P) => string[]`. This allows the key to be based on the params of the query.

If the key is not a function, but the query takes a parameter, the param is serialized and added as the last key fragment.

### Loading Function

The loading function is invoked whenever the query is first used and subsequently, when its (reactive) param changes or when its `refetch` function is called.

It is an asynchronous function that takes one argument and returns a promise of either a `{ success: true, data }` or a `{ success: false, error }` object. To construct these objects you can also use the `succeed` and `fail` functions which are provided.

    const useFriend = createQuery(
      ({ id }) => ["friend", `${id}`],
      async ({ id }: { id: number}) => {
        try {
          const data = await fetchFriend(id);
          return succeed(data);
        } catch (error) {
          return fail(error);
        }
      }
    );

### The Query itself

Once you created a query, its time to use it. Invoke it and you get access to its loadingstate, data and errors. It will load right away, but if you want to manually trigger a reload down the line, you can use the refetch function, which is also provided.

If you
