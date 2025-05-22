import { AnswerAgent } from './AnswerAgent'; // Adjust path if necessary
import { LLMChain } from 'langchain/chains';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { Moderation } from '../../../moderation/Moderation'; // Adjust path
import { ICommonObject, INodeData, ICommonObjectStore } from '../../../../src/Interface'; // Adjust path

// Mock BaseLanguageModel
class MockChatModel extends BaseLanguageModel {
    _llmType() {
        return "mock_chat_model";
    }
    async _generate(messages: any, options: any) {
        // Simple echo for testing prompt formatting
        const lastMessageContent = messages[messages.length - 1].content;
        return {
            generations: [{ text: `LLM Mock Response to: ${lastMessageContent}` }],
            llmOutput: {},
        };
    }
    _modelType(): string {
        return "base_chat_model";
    }
    _combineLLMOutput(...llmOutputs: Array<Record<string, any> | undefined>): Record<string, any> | undefined {
        return {};
    }
    // @ts-ignore
    withStructuredOutput(schema: any, config?: any) {
        // Mock this method to return a runnable that simulates LLM call for structured output
        return {
            invoke: async (input: any) => {
                // In a real scenario, this would try to format according to schema
                // For testing, let's assume it processes input and returns a structured-like object
                // or a string that the OutputFixingParser would then handle.
                let responseText = `LLM Mock Structured Response to: ${input.question || JSON.stringify(input)}`;
                if (schema && schema.name === 'fixedSchema') { // for testing output fixing
                    return { answer: "Fixed: " + responseText };
                }
                // Simulate malformed JSON for jsonrepair test
                if (schema && schema.name === 'malformed_json_schema_test') {
                    return `{ "answer": "Malformed: ${responseText}", "sources": ["source1", "source2"`; // Missing closing brace and quotes
                }
                // Simulate output not matching schema for OutputFixingParser (difficult to fully mock)
                if (schema && schema.name === 'schema_mismatch_test') {
                    return { wrong_field: "Data that doesn't match schema" };
                }
                return { answer: responseText, sources: ["source1", "source2"] };
            }
        };
    }
}

describe('AnswerAgent Node', () => {
    let mockModel: MockChatModel;
    let appDataSource: any; // Mock DataSource
    let databaseEntities: any; // Mock IDatabaseEntity

    beforeEach(() => {
        mockModel = new MockChatModel({});
        appDataSource = {
            getRepository: jest.fn().mockReturnThis(),
            findOneBy: jest.fn().mockResolvedValue(undefined) // Mock for getVM if it tries to load credentials
        };
        databaseEntities = {
            Credential: jest.fn()
        };
    });

    const getMinimalNodeData = (outputName = 'outputPrediction'): INodeData => ({
        inputs: {
            model: mockModel,
            systemMessagePrompt: 'You are a test assistant.',
            humanMessagePrompt: 'User question: {question}',
        },
        outputs: { output: outputName },
        node: {
            id: 'test-node-id',
            data: {
                id: 'test-node-id',
                name: 'answerAgent',
                label: 'Answer Agent',
                type: 'AnswerAgent',
                version: 1,
                inputs: [], // Simplified for testing, actual inputs are on nodeData.inputs
                outputs: [],
                category: 'Agents',
                baseClasses: ['AnswerAgent', 'LLMChain'],
                filePath: 'packages/components/nodes/chains/AnswerAgent/AnswerAgent.ts' // Mock file path
            },
            // other INode properties if needed by getVM or other utils
            icon: 'answerAgent.svg',
            type: 'AnswerAgent',
            name: 'answerAgent',
            version: 1,
            label: 'Answer Agent',
            category: 'Agents',
            description: 'Test desc',
            baseClasses: ['AnswerAgent', 'LLMChain'],
        },
        id: 'test-node-id',
        instance: undefined, // Will be set by init
        inputAliases: {},
        credential: '',
        inputParams: [],
        outputParams: [],
        memoryToSave: [],
        // @ts-ignore
        credentialData: undefined
    });

    const getOptions = (): ICommonObject => ({
        appDataSource,
        databaseEntities,
        logger: console, // Basic logger for testing
        // Add other common options if needed by the node's methods
    });

    test('should initialize correctly and create an LLMChain instance', async () => {
        const nodeData = getMinimalNodeData('answerAgent'); // Output the chain itself
        const answerAgent = new AnswerAgent();
        const chainInstance = await answerAgent.init(nodeData, '', getOptions());

        expect(chainInstance).toBeInstanceOf(LLMChain);
        expect(chainInstance.prompt).toBeDefined();
        expect(chainInstance.llm).toBe(mockModel);
        expect(answerAgent.outputParser).toBeUndefined(); // No Zod schema provided
    });

    test('run method should return raw string output when no Zod schema is provided', async () => {
        const nodeData = getMinimalNodeData();
        const answerAgent = new AnswerAgent();
        nodeData.instance = await answerAgent.init(nodeData, 'Test question from user?', getOptions()); // Init to set up the chain instance

        const result = await answerAgent.run(nodeData, 'Test question from user?', getOptions());

        expect(typeof result.output).toBe('string');
        expect(result.output).toContain('LLM Mock Response to: User question: Test question from user?');
        expect(result.fullResponse).toContain('LLM Mock Response to: User question: Test question from user?');
    });

    test('run method should use promptValues to format the prompt', async () => {
        const nodeData = getMinimalNodeData();
        nodeData.inputs.humanMessagePrompt = 'Translate {text_to_translate} from {lang_from} to {lang_to}.';
        nodeData.inputs.promptValues = {
            //lang_from: 'English', // Test with one missing to see if 'question' input is used
            lang_to: 'French',
            text_to_translate: 'Hello world'
        };
        const answerAgent = new AnswerAgent();
        // When init is called for 'outputPrediction', it directly calls run.
        // So we can test the run logic by checking the output of init.
        const result = await answerAgent.init(nodeData, 'Placeholder for question if not all covered by promptValues', getOptions()) as { output: string, fullResponse: string };

        expect(result.output).toContain('LLM Mock Response to: Translate Hello world from {lang_from} to French.');
    });

    test('init should create and use StructuredOutputParser when zodSchema is provided', async () => {
        const nodeData = getMinimalNodeData('answerAgent');
        nodeData.inputs.zodSchema = `z.object({ answer: z.string().describe("The final answer"), sources: z.array(z.string()).describe("Cited sources") })`;
        const answerAgent = new AnswerAgent();
        const chainInstance = await answerAgent.init(nodeData, '', getOptions());

        expect(answerAgent.outputParser).toBeDefined();
        expect(answerAgent.outputParser).toBeInstanceOf(Object); // Langchain's StructuredOutputParser or OutputFixingParser
        // Check if format instructions are injected
        const humanMessagePrompt = (chainInstance.prompt as any).promptMessages.find((p: any) => p.constructor.name === 'HumanMessagePromptTemplate');
        expect(humanMessagePrompt.prompt.template).toContain('format_instructions');
    });

    test('run method should return parsed JSON output when zodSchema is provided', async () => {
        const nodeData = getMinimalNodeData();
        nodeData.inputs.zodSchema = `z.object({ answer: z.string(), sources: z.array(z.string()) })`;
        const answerAgent = new AnswerAgent();

        const result = await answerAgent.init(nodeData, 'Test question for JSON output', getOptions()) as { output: any, fullResponse: string };

        expect(typeof result.output).toBe('object');
        expect(result.output.answer).toContain('LLM Mock Structured Response to: Test question for JSON output');
        expect(result.output.sources).toEqual(['source1', 'source2']);
        // fullResponse in the actual node is the raw text, but our mock withStructuredOutput directly gives an object.
        // For this test, we primarily care about result.output being structured.
        // If chain.call returns { text: '...' } then result.fullResponse would be that text.
        // The mock currently doesn't allow testing this part easily for structured output.
    });

    test('run method should attempt to repair malformed JSON if zodSchema is provided', async () => {
        const nodeData = getMinimalNodeData();
        // Use a schema name that our MockChatModel's withStructuredOutput will use to return malformed JSON
        nodeData.inputs.zodSchema = `z.object({ name: z.literal('malformed_json_schema_test'), answer: z.string(), sources: z.array(z.string()) })`;
        const answerAgent = new AnswerAgent();

        const result = await answerAgent.init(nodeData, 'Test malformed JSON repair', getOptions()) as { output: any, fullResponse: string };
        
        // jsonrepair should fix it
        expect(typeof result.output).toBe('object');
        expect(result.output.answer).toContain('Malformed: LLM Mock Structured Response to: Test malformed JSON repair');
        expect(result.output.sources).toEqual(['source1', 'source2']);
    });
    
    test('init should throw error for invalid Zod schema', async () => {
        const nodeData = getMinimalNodeData('answerAgent');
        nodeData.inputs.zodSchema = `z.object({ answer: z.string()`; // Intentionally invalid
        const answerAgent = new AnswerAgent();
        
        // The error message in AnswerAgent.ts is "Failed to parse Zod schema or inject output parser: ${e.message}"
        // and eval will throw SyntaxError for this invalid schema.
        await expect(answerAgent.init(nodeData, '', getOptions()))
              .rejects
              .toThrow(/Failed to parse Zod schema or inject output parser: Unexpected end of input|Error parsing Zod Schema/); 
    });

    // Mock for Moderation
    class MockModeration extends Moderation {
        constructor(fields: any) {
            super(fields);
            this.name = 'mockModeration';
        }
        async checkForViolations(input: string | ICommonObject): Promise<string | ICommonObject> {
            const check = (text: string) => {
                if (text.includes('forbidden word')) {
                    throw new Error('Input moderation failed: Content violates policy.');
                }
                return text;
            }
            if (typeof input === 'string') {
                return check(input);
            }
            const checkedInput: ICommonObject = { ...input };
            for(const key in checkedInput){
                if(typeof checkedInput[key] === 'string'){
                    checkedInput[key] = check(checkedInput[key] as string);
                }
            }
            return checkedInput;
        }
    }

    test('run method should handle input moderation violation', async () => {
        const nodeData = getMinimalNodeData();
        nodeData.inputs.inputModeration = [new MockModeration({})]; 
        const answerAgent = new AnswerAgent();
        
        // When init is called for 'outputPrediction', it directly calls run.
        const result = await answerAgent.init(nodeData, 'A question with forbidden word', getOptions()) as { output: any, fullResponse: string };
        
        expect(result.output).toContain('Input moderation failed: Content violates policy.');
    });

    test('run method should pass input through if moderation succeeds', async () => {
        const nodeData = getMinimalNodeData();
        nodeData.inputs.inputModeration = [new MockModeration({})];
        const answerAgent = new AnswerAgent();

        const result = await answerAgent.init(nodeData, 'A perfectly fine question', getOptions()) as { output: any, fullResponse: string };

        expect(result.output).toContain('LLM Mock Response to: User question: A perfectly fine question');
    });
});
