import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { crmService } from "../services/crmService";
import { estimationService } from "../services/estimationService";
import { catalogService } from "../services/catalogService";

/**
 * Tool to lookup a client by name or create a new one if not found.
 * Updates the agent state with the active client ID.
 */
export const lookupOrCreateClientTool = tool(
  async ({ name, email, phone, createIfMissing }: { name: string, email?: string, phone?: string, createIfMissing: boolean }) => {
    console.log(`Looking up client: ${name}`);
    
    // 1. Search for existing client
    const clients = await crmService.findClientByName(name);
    
    if (clients.length > 0) {
      // Found matches
      const bestMatch = clients[0]; // Simplification: take the first one
      return {
        message: `Found client: ${bestMatch.name}`,
        client: bestMatch,
        found: true,
        action: "set_active_client",
        clientId: bestMatch.id
      };
    }

    // 2. If not found and requested to create
    if (createIfMissing) {
      console.log(`Creating new client: ${name}`);
      const newClient = await crmService.createClient({
        name,
        email,
        phone
      });
      
      return {
        message: `Created new client: ${newClient.name}`,
        client: newClient,
        found: true,
        created: true,
        action: "set_active_client",
        clientId: newClient.id
      };
    }

    // 3. Not found and not creating
    return {
      message: `Client '${name}' not found. Ask the user if they want to create it.`,
      found: false
    };
  },
  {
    name: "lookup_or_create_client",
    description: "Search for a client by name. If not found, can create a new one. Returns client details and ID.",
    schema: z.object({
      name: z.string().describe("Name of the client or company to search for"),
      email: z.string().optional().describe("Email of the client (for creation)"),
      phone: z.string().optional().describe("Phone number of the client (for creation)"),
      createIfMissing: z.boolean().default(false).describe("Set to true if you want to create the client if it doesn't exist")
    })
  }
);

/**
 * Tool to list all estimations for a client.
 */
export const listClientEstimationsTool = tool(
  async ({ clientId }: { clientId: string }) => {
    try {
      const estimations = await estimationService.getAllEstimationsForClient(clientId);
      
      if (estimations.length === 0) {
        return {
          message: "No estimations found for this client.",
          estimations: [],
          count: 0
        };
      }

      // Get item counts for each estimation
      const estimationsWithDetails = await Promise.all(
        estimations.map(async (est) => {
          const details = await estimationService.getEstimationDetails(est.id);
          return {
            id: est.id,
            sequential_number: est.sequential_number,
            status: est.status,
            created_at: est.created_at,
            net_total: est.net_total || 0,
            item_count: details?.items?.length || 0
          };
        })
      );

      // Format message for LLM with clear UUID instructions
      const formattedList = estimationsWithDetails
        .map((est, idx) => 
          `${idx + 1}. Quote #${est.sequential_number} (ID: ${est.id}): $${est.net_total.toFixed(2)} - ${est.item_count} item(s) - ${est.status} - ${new Date(est.created_at!).toLocaleDateString()}`
        )
        .join('\n');

      return {
        message: `Found ${estimations.length} estimation(s) for this client:\n${formattedList}\n\nIMPORTANT: When the user selects a quote, use the ID (UUID) value, NOT the sequential number.`,
        estimations: estimationsWithDetails,
        count: estimations.length
      };
    } catch (error: any) {
      return {
        message: `Error listing estimations: ${error.message}`,
        estimations: [],
        count: 0
      };
    }
  },
  {
    name: "list_client_estimations",
    description: "List all estimations (quotes) for a client with their status, totals, and item counts. Use this when there are multiple estimations and you need to ask the user which one to work on.",
    schema: z.object({
      clientId: z.string().describe("The UUID of the client")
    })
  }
);

/**
 * Tool to manage the quote context (create new or resume draft).
 */
export const manageQuoteContextTool = tool(
  async ({ clientId, action, notes, estimationId }: { clientId: string, action: "check_draft" | "create_new" | "resume_existing", notes?: string, estimationId?: string }) => {
    
    if (action === "check_draft") {
      // First, check if there are multiple drafts
      const draftCount = await estimationService.countDraftEstimations(clientId);
      
      if (draftCount > 1) {
        return {
          message: `Found ${draftCount} draft quotes for this client. Please use 'list_client_estimations' to see all options and ask the user which one to work on.`,
          hasDraft: true,
          multipleDrafts: true,
          draftCount: draftCount,
          action: "ask_user_which_estimation"
        };
      }
      
      // If only one draft (or zero), proceed as before
      const draft = await estimationService.findDraftEstimation(clientId);
      if (draft) {
        return {
          message: `Found an existing draft quote #${draft.sequential_number} from ${new Date(draft.created_at!).toLocaleDateString()}.`,
          estimation: draft,
          hasDraft: true,
          action: "set_active_estimation",
          estimationId: draft.id
        };
      } else {
        return {
          message: "No draft quote found for this client.",
          hasDraft: false
        };
      }
    }

    if (action === "resume_existing") {
      if (!estimationId) {
        return {
          message: "Error: estimationId is required when action is 'resume_existing'.",
          error: true
        };
      }

      const estimation = await estimationService.getEstimationById(estimationId);
      if (!estimation) {
        return {
          message: `Error: Estimation with ID '${estimationId}' not found.`,
          error: true
        };
      }

      return {
        message: `Resuming work on quote #${estimation.sequential_number} (${estimation.status}).`,
        estimation: estimation,
        action: "set_active_estimation",
        estimationId: estimation.id
      };
    }

    if (action === "create_new") {
      const newQuote = await estimationService.createEstimation(clientId, notes);
      return {
        message: `Created new quote #${newQuote.sequential_number}.`,
        estimation: newQuote,
        action: "set_active_estimation",
        estimationId: newQuote.id
      };
    }
  },
  {
    name: "manage_quote_context",
    description: "Check for existing draft quotes, resume a specific estimation, or create a new quote for a client.",
    schema: z.object({
      clientId: z.string().describe("The UUID of the client"),
      action: z.enum(["check_draft", "create_new", "resume_existing"]).describe("Action to perform: check for draft, create new, or resume a specific estimation"),
      notes: z.string().optional().describe("Initial notes for the new quote (only used with create_new)"),
      estimationId: z.string().optional().describe("The UUID of the estimation to resume (required when action is 'resume_existing')")
    })
  }
);

/**
 * Tool to search for items and add them to the active quote.
 */
export const searchAndAddItemTool = tool(
  async ({ estimationId, searchQuery, quantity, unitOverride }: { estimationId: string, searchQuery: string, quantity: number, unitOverride?: string }) => {
    
    // 1. Search catalog
    const items = await catalogService.searchCatalogItems(searchQuery);
    
    if (items.length === 0) {
      return {
        message: `No items found matching '${searchQuery}'. Please ask for a more specific name or create a custom item.`,
        added: false
      };
    }

    // 2. Select best match (simplification: first one)
    // In a real scenario, we might ask the user to clarify if multiple matches
    const selectedItem = items[0];

    // 3. Add to estimation
    const addedItem = await estimationService.addItemToEstimation(estimationId, {
      itemId: selectedItem.id,
      description: selectedItem.name!, // Use catalog name
      quantity: quantity,
      unit: unitOverride || selectedItem.unit!,
      unitCost: selectedItem.unit_cost!,
      categoryId: selectedItem.category_id!
    });

    return {
      message: `Added '${selectedItem.name}' to quote. Quantity: ${quantity} ${addedItem.unit}. Total: $${addedItem.line_total}`,
      added: true,
      item: addedItem
    };
  },
  {
    name: "search_and_add_item",
    description: "Search for an item in the catalog and add it to the active quote.",
    schema: z.object({
      estimationId: z.string().describe("The UUID of the active quote"),
      searchQuery: z.string().describe("Name or description of the item to search for (e.g. 'concrete', 'rebar')"),
      quantity: z.number().describe("Quantity to add"),
      unitOverride: z.string().optional().describe("Optional unit override (e.g. 'SF', 'LF')")
    })
  }
);

/**
 * Tool to search for clients by name or email.
 */
export const searchClients = tool(
  async ({ query }) => {
    try {
      const clients = await crmService.searchClients(query);
      
      if (clients.length === 0) {
        return "No clients found matching that name or email.";
      }

      return JSON.stringify(clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone
      })));
    } catch (error: any) {
      return `Error searching clients: ${error.message}`;
    }
  },
  {
    name: "search_clients",
    description: "Search for a client by name or email. Use this when the user mentions a client name (e.g., 'Peachtree') but you don't have their ID.",
    schema: z.object({
      query: z.string().describe("The name or email fragment to search for"),
    }),
  }
);

export const crmTools = [
  lookupOrCreateClientTool,
  manageQuoteContextTool,
  searchAndAddItemTool,
  searchClients,
  listClientEstimationsTool
];
