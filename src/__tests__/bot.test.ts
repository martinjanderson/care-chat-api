import { botResponse } from '../botService';

const prompt = "One plus one is: ";

test('prompt returns something', () => {
    return botResponse(prompt, 'reflections').then(message => {
        console.log(message);
        expect(message).not.toBeNull();
    });
});


